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
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const handleError_1 = require("./../utils/handleError");
const JWT_SECRET = process.env.JWT_SECRET || 'Secret';
function authJWT(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return (0, handleError_1.errorHandler)(new handleError_1.AppError('Authorization Error', 401, 'Token não fornecido', true), res);
        }
        const [schema, token] = authHeader.split(' ');
        try {
            // const decoded: any = await promisify(jwt.verify)(token, JWT_SECRET)
            // const idUserByToken = decoded.id
            return yield jsonwebtoken_1.default.verify(token, JWT_SECRET, (error, decoded) => {
                if (error) {
                    return (0, handleError_1.errorHandler)(new handleError_1.AppError('Authorization Error', 401, 'Não autorizado ou token inválido', true), res);
                }
                res.setHeader('userID', decoded === null || decoded === void 0 ? void 0 : decoded.id);
                return next();
            });
        }
        catch (err) {
            return (0, handleError_1.errorHandler)(new handleError_1.AppError('Authorization Error', 401, 'Não autorizado ou token inválido', true), res);
        }
    });
}
exports.default = authJWT;
