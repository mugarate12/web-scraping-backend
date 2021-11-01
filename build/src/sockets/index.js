"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const servicesSockets_1 = __importDefault(require("./servicesSockets"));
function RunSockets(ioServer) {
    (0, servicesSockets_1.default)(ioServer);
}
exports.default = RunSockets;
