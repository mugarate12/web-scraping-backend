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
Object.defineProperty(exports, "__esModule", { value: true });
const handleError_1 = require("./../utils/handleError");
const connection = require('./../database');
const { MONITORING_TABLE_NAME } = require('./../database/types');
class MonitoringRepository {
    constructor() {
        this.reference = () => connection(MONITORING_TABLE_NAME);
        this.create = ({ name, content }) => __awaiter(this, void 0, void 0, function* () {
            return this.reference()
                .insert({
                name,
                content
            })
                .then(() => {
                return;
            })
                .catch(error => {
                throw new handleError_1.AppError('Database Error', 406, error.message, true);
            });
        });
        this.index = () => __awaiter(this, void 0, void 0, function* () {
            return this.reference()
                .select('*')
                .then(monitoring => monitoring)
                .catch(error => {
                throw new handleError_1.AppError('Database Error', 406, error.message, true);
            });
        });
        this.get = ({ name }) => __awaiter(this, void 0, void 0, function* () {
            return this.reference()
                .where('name', '=', name)
                .select('*')
                .first()
                .then(monitoring => monitoring)
                .catch(error => {
                throw new handleError_1.AppError('Database Error', 406, error.message, true);
            });
        });
        this.update = ({ name, content }) => __awaiter(this, void 0, void 0, function* () {
            return this.reference()
                .where('name', '=', name)
                .first()
                .update({
                content
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
exports.default = MonitoringRepository;
