"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const moment_1 = __importDefault(require("moment"));
const controllers_1 = require("./../controllers");
const repositories_1 = require("./../repositories");
function normalizeDownDetectorResult(downDetectorResult) {
    const baselines = downDetectorResult.baseline;
    const reports = downDetectorResult.reports;
    const data = baselines.map((baseline, index) => {
        return {
            date: (0, moment_1.default)(baseline.x).format('YYYY-MM-DD HH:mm:ss'),
            baseline: baseline.y,
            notificationCount: reports[index].y
        };
    });
    return data;
}
function createStatusChangeString(lastRegistryOfChange, downDetectorResult) {
    if (lastRegistryOfChange.length > 0) {
        const lastRegistryStatusLetter = lastRegistryOfChange[0].status_atual[0].toUpperCase();
        const actualStatusLetter = downDetectorResult.status[0].toUpperCase();
        const change = `${lastRegistryStatusLetter}${actualStatusLetter}`;
        return change;
    }
    else {
        const actualStatusLetter = downDetectorResult.status[0].toUpperCase();
        return actualStatusLetter;
    }
}
function updateOrCreateMonitoringService(downDetectorResult) {
    return __awaiter(this, void 0, void 0, function* () {
        const normalizedData = normalizeDownDetectorResult(downDetectorResult);
        const registryDataPromises = normalizedData.map((downDetectorReport) => __awaiter(this, void 0, void 0, function* () {
            yield repositories_1.downDetectorHistRepository.create({
                site_d: downDetectorResult.url,
                hist_date: downDetectorReport.date,
                baseline: downDetectorReport.baseline,
                notification_count: downDetectorReport.notificationCount
            })
                .catch(error => { });
        }));
        const lastRegistryOfChange = yield repositories_1.downDetectorChangeRepository.index({
            identifiers: {
                serviceURL: downDetectorResult.url
            },
            orderBy: { property: 'id', orientation: 'desc' },
            limit: 1
        });
        if (lastRegistryOfChange.length === 0) {
            yield repositories_1.downDetectorChangeRepository.create({
                site_c: downDetectorResult.url,
                hist_date: (0, moment_1.default)().format('YYYY-MM-DD HH:mm:ss'),
                status_anterior: '',
                status_atual: downDetectorResult.status,
                status_change: createStatusChangeString(lastRegistryOfChange, downDetectorResult)
            });
        }
        if (lastRegistryOfChange.length > 0 && lastRegistryOfChange[0].status_atual !== downDetectorResult.status) {
            yield repositories_1.downDetectorChangeRepository.create({
                site_c: downDetectorResult.url,
                hist_date: (0, moment_1.default)().format('YYYY-MM-DD HH:mm:ss'),
                status_anterior: lastRegistryOfChange[0].status_atual,
                status_atual: downDetectorResult.status,
                status_change: createStatusChangeString(lastRegistryOfChange, downDetectorResult)
            });
        }
        yield Promise.all(registryDataPromises);
    });
}
function emitUpdatedMonitoring(serverIo) {
    return __awaiter(this, void 0, void 0, function* () {
        const emittedCall = 'monitoring-updated';
        const monitoring = yield repositories_1.monitoringRepository.index();
        serverIo.emit(emittedCall, monitoring);
    });
}
function routinesRequests(serverIo, browser, updateTime) {
    return __awaiter(this, void 0, void 0, function* () {
        const requests = yield repositories_1.servicesRepository.index({ update_time: updateTime })
            .then(services => services)
            .catch(error => console.log('error', error));
        if (!!requests && requests.length > 0) {
            console.log(`requisitando serviços de update em ${updateTime} minuto(s)`);
            const requestsResultsPromises = requests.map((request) => __awaiter(this, void 0, void 0, function* () {
                const result = yield controllers_1.downDetectorController.accessDownDetectorRoutine(request.service_name, browser);
                yield updateOrCreateMonitoringService(result);
            }));
            yield Promise.all(requestsResultsPromises);
            // await emitUpdatedMonitoring(serverIo)
            console.log('requisições finalizadas');
        }
    });
}
exports.default = routinesRequests;
