"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.usersController = exports.sessionController = exports.servicesController = exports.downDetectorController = void 0;
const downDetector_1 = __importDefault(require("./downDetector"));
const servicesController_1 = __importDefault(require("./servicesController"));
const sessionController_1 = __importDefault(require("./sessionController"));
const usersController_1 = __importDefault(require("./usersController"));
exports.downDetectorController = new downDetector_1.default();
exports.servicesController = new servicesController_1.default();
exports.sessionController = new sessionController_1.default();
exports.usersController = new usersController_1.default();
