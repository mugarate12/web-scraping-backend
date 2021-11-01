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
Object.defineProperty(exports, "__esModule", { value: true });
const repositories_1 = require("./../repositories");
const handleError_1 = require("./../utils/handleError");
class servicesController {
    constructor() {
        this.add = (req, res) => __awaiter(this, void 0, void 0, function* () {
            const { serviceName, updateTime } = req.body;
            yield repositories_1.servicesRepository.create({
                serviceName,
                update_time: Number(updateTime)
            })
                .then(() => {
                return res.status(201).json({
                    message: 'service added to monitoring successful!'
                });
            })
                .catch((error) => {
                return (0, handleError_1.errorHandler)(new handleError_1.AppError(error.name, 403, error.message, true), res);
            });
        });
        this.update = (req, res) => __awaiter(this, void 0, void 0, function* () {
            const { updateTime } = req.body;
            const { serviceID } = req.params;
            yield repositories_1.servicesRepository.update({
                id: Number(serviceID),
                update_time: Number(updateTime)
            })
                .then(() => {
                return res.status(200).json({
                    message: 'update service monitoring time successful!'
                });
            })
                .catch((error) => {
                return (0, handleError_1.errorHandler)(new handleError_1.AppError(error.name, 403, error.message, true), res);
            });
        });
        this.delete = (req, res) => __awaiter(this, void 0, void 0, function* () {
            const { serviceID } = req.params;
            yield repositories_1.servicesRepository.delete(Number(serviceID))
                .then(() => {
                return res.status(200).json({
                    message: 'delete service monitoring successful!'
                });
            })
                .catch((error) => {
                return (0, handleError_1.errorHandler)(new handleError_1.AppError(error.name, 403, error.message, true), res);
            });
        });
    }
}
exports.default = servicesController;
