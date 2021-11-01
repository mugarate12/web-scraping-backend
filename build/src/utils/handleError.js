"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = exports.AppError = void 0;
class AppError extends Error {
    constructor(name, httpCode, description, isOperational) {
        super(description);
        Object.setPrototypeOf(this, new.target.prototype);
        this.name = name;
        this.httpCode = httpCode;
        this.isOperational = isOperational;
        Error.captureStackTrace(this);
    }
}
exports.AppError = AppError;
function errorHandler(error, res) {
    return res.status(error.httpCode | 400).json({
        error: {
            name: error.name,
            message: error.message
        }
    });
}
exports.errorHandler = errorHandler;
