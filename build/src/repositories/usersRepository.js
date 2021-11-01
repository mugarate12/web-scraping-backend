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
const handleError_1 = require("./../utils/handleError");
const connection = require('./../database');
const { USERS_TABLE_NAME } = require('./../database/types');
class UsersRepository {
    constructor() {
        this.reference = () => connection(USERS_TABLE_NAME);
        this.create = ({ login, password }) => __awaiter(this, void 0, void 0, function* () {
            const salt = yield bcryptjs_1.default.genSalt();
            password = yield bcryptjs_1.default.hash(password, salt);
            return this.reference()
                .insert({
                login,
                password
            })
                .then(() => {
                return;
            })
                .catch(error => {
                throw new handleError_1.AppError('Database Error', 406, error.message, true);
            });
        });
        this.get = ({ id, login }) => __awaiter(this, void 0, void 0, function* () {
            let query = this.reference();
            if (!!id) {
                query = query.where('id', '=', id);
            }
            if (!!login) {
                query = query.where('login', '=', login);
            }
            return query
                .first()
                .select('*')
                .then(user => user)
                .catch(error => {
                throw new handleError_1.AppError('Database Error', 406, error.message, true);
            });
        });
        this.index = ({}) => __awaiter(this, void 0, void 0, function* () {
            let query = this.reference();
            return query
                .select('*')
                .then(downDetectorHists => downDetectorHists)
                .catch(error => {
                throw new handleError_1.AppError('Database Error', 406, error.message, true);
            });
        });
        this.update = ({ identifiers, payload }) => __awaiter(this, void 0, void 0, function* () {
            let query = this.reference();
            if (!!identifiers.id) {
                query = query.where('id', '=', identifiers.id);
            }
            if (!!identifiers.login) {
                query = query.where('login', '=', identifiers.login);
            }
            const salt = yield bcryptjs_1.default.genSalt();
            const password = yield bcryptjs_1.default.hash(payload.password, salt);
            return query
                .update({
                password
            })
                .then(() => {
                return;
            })
                .catch(error => {
                throw new handleError_1.AppError('Database Error', 406, error.message, true);
            });
        });
    }
}
exports.default = UsersRepository;
