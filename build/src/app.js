"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const routes_1 = __importDefault(require("./routes"));
const routines_1 = __importDefault(require("./routines"));
const sockets_1 = __importDefault(require("./sockets"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
const io = new socket_io_1.Server(server, {
    cors: {
        origin: ['http://localhost:3000', '*', String(process.env.FRONTEND_HOST)]
    }
});
app.use((0, cors_1.default)({
    origin: ['http://localhost:3000', 'https://web-scraping-frontend.vercel.app', '*', String(process.env.FRONTEND_HOST)],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['*'],
    exposedHeaders: ['Authorization', 'Content-Type', 'Content-Disposition', 'Access-Control-Allow-Headers', 'Origin', 'Accept', 'X-Requested-With', 'filename'],
    preflightContinue: false,
    optionsSuccessStatus: 204
}));
app.use(express_1.default.json());
app.use(routes_1.default);
// run routines
(0, routines_1.default)(io);
// sockets
(0, sockets_1.default)(io);
exports.default = server;
