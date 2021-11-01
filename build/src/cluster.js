"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cluster_1 = __importDefault(require("cluster"));
const os_1 = require("os");
if (cluster_1.default.isPrimary) {
    (0, os_1.cpus)().forEach(() => cluster_1.default.fork());
    cluster_1.default.on('exit', (worker) => {
        cluster_1.default.fork();
    });
}
else {
    require('./server');
}
