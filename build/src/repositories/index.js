"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.usersRepository = exports.servicesRepository = exports.monitoringRepository = exports.downDetectorHistRepository = exports.downDetectorChangeRepository = void 0;
const downDetectorChangeRepository_1 = __importDefault(require("./downDetectorChangeRepository"));
const downDetectorHistRepository_1 = __importDefault(require("./downDetectorHistRepository"));
const monitoringRepository_1 = __importDefault(require("./monitoringRepository"));
const servicesRepository_1 = __importDefault(require("./servicesRepository"));
const usersRepository_1 = __importDefault(require("./usersRepository"));
exports.downDetectorChangeRepository = new downDetectorChangeRepository_1.default();
exports.downDetectorHistRepository = new downDetectorHistRepository_1.default();
exports.monitoringRepository = new monitoringRepository_1.default();
exports.servicesRepository = new servicesRepository_1.default();
exports.usersRepository = new usersRepository_1.default();
