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
exports.fifteenMinuteRoutines = exports.teenMinuteRoutines = exports.fiveMinuteRoutines = exports.threeMinuteRoutines = exports.oneMinuteRoutines = exports.convertMinutesToMilliseconds = void 0;
const puppeteer_1 = __importDefault(require("puppeteer"));
const downDetectorRoutines_1 = __importDefault(require("./downDetectorRoutines"));
let runOneMinuteRoutines = true;
let runThreeMinutesRoutines = true;
let runFiveMinutesRoutines = true;
let runTeenMinutesRoutines = true;
let runFifteenMinutesRoutines = true;
function runBrowser() {
    return __awaiter(this, void 0, void 0, function* () {
        const browser = yield puppeteer_1.default.launch({ headless: true, args: ['--no-sandbox'], slowMo: 200 });
        return browser;
    });
}
function convertMinutesToMilliseconds(minutes) {
    const oneMinuteInMilliseconds = 60000;
    return oneMinuteInMilliseconds * minutes;
}
exports.convertMinutesToMilliseconds = convertMinutesToMilliseconds;
function sleep(milliseconds) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise(resolve => setTimeout(resolve, milliseconds));
    });
}
// rotina de um minuto
function oneMinuteRoutines(serverIo, browser) {
    return __awaiter(this, void 0, void 0, function* () {
        if (runOneMinuteRoutines) {
            runOneMinuteRoutines = false;
            yield (0, downDetectorRoutines_1.default)(serverIo, browser, 1);
            yield sleep(convertMinutesToMilliseconds(1));
            runOneMinuteRoutines = true;
        }
    });
}
exports.oneMinuteRoutines = oneMinuteRoutines;
// rotina de três minutos
function threeMinuteRoutines(serverIo, browser) {
    return __awaiter(this, void 0, void 0, function* () {
        if (runThreeMinutesRoutines) {
            runThreeMinutesRoutines = false;
            yield (0, downDetectorRoutines_1.default)(serverIo, browser, 3);
            yield sleep(convertMinutesToMilliseconds(3));
            runThreeMinutesRoutines = true;
        }
    });
}
exports.threeMinuteRoutines = threeMinuteRoutines;
// rotina de cinco minutos
function fiveMinuteRoutines(serverIo, browser) {
    return __awaiter(this, void 0, void 0, function* () {
        if (runFiveMinutesRoutines) {
            runFiveMinutesRoutines = false;
            yield (0, downDetectorRoutines_1.default)(serverIo, browser, 5);
            yield sleep(convertMinutesToMilliseconds(5));
            runFiveMinutesRoutines = true;
        }
    });
}
exports.fiveMinuteRoutines = fiveMinuteRoutines;
// rotina de dez minutos
function teenMinuteRoutines(serverIo, browser) {
    return __awaiter(this, void 0, void 0, function* () {
        if (runTeenMinutesRoutines) {
            runTeenMinutesRoutines = false;
            yield (0, downDetectorRoutines_1.default)(serverIo, browser, 10);
            yield sleep(convertMinutesToMilliseconds(10));
            runTeenMinutesRoutines = true;
        }
    });
}
exports.teenMinuteRoutines = teenMinuteRoutines;
// rotina de quinze minutos
function fifteenMinuteRoutines(serverIo, browser) {
    return __awaiter(this, void 0, void 0, function* () {
        if (runFifteenMinutesRoutines) {
            runFifteenMinutesRoutines = false;
            yield (0, downDetectorRoutines_1.default)(serverIo, browser, 15);
            yield sleep(convertMinutesToMilliseconds(15));
            runFifteenMinutesRoutines = true;
        }
    });
}
exports.fifteenMinuteRoutines = fifteenMinuteRoutines;
exports.default = (serverIo) => __awaiter(void 0, void 0, void 0, function* () {
    const browser = yield runBrowser();
    setInterval(() => {
        oneMinuteRoutines(serverIo, browser);
        threeMinuteRoutines(serverIo, browser);
        fiveMinuteRoutines(serverIo, browser);
        teenMinuteRoutines(serverIo, browser);
        fifteenMinuteRoutines(serverIo, browser);
    }, 5000);
});
