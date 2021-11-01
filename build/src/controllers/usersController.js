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
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const repositories_1 = require("./../repositories");
const handleError_1 = require("./../utils/handleError");
class UsersController {
    constructor() {
        this.create = (req, res) => __awaiter(this, void 0, void 0, function* () {
            const { login, password } = req.body;
            return yield repositories_1.usersRepository.create({
                login,
                password
            })
                .then(() => {
                return res.status(201).json({
                    message: 'usuário criado com sucesso!'
                });
            })
                .catch((err) => {
                return (0, handleError_1.errorHandler)(err, res);
            });
        });
        this.update = (req, res) => __awaiter(this, void 0, void 0, function* () {
            const userID = Number(res.getHeader('userID'));
            const { password } = req.body;
            const user = yield repositories_1.usersRepository.get({ id: userID })
                .then(user => user)
                .catch(error => {
                return undefined;
            });
            if (!user) {
                return (0, handleError_1.errorHandler)(new handleError_1.AppError('Erros de usuário', 406, 'usuário não encontrado', true), res);
            }
            if (bcryptjs_1.default.compareSync(password, user.password)) {
                return yield repositories_1.usersRepository.update({
                    identifiers: {
                        id: userID
                    },
                    payload: {
                        password: password
                    }
                })
                    .then(() => {
                    return res.status(200).json({
                        message: 'senha atualizada com sucesso!'
                    });
                })
                    .catch((err) => {
                    return (0, handleError_1.errorHandler)(err, res);
                });
            }
        });
    }
}
exports.default = UsersController;
