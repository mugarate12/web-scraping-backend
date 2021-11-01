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
const { SERVICES_TABLE_NAME } = require('./../database/types');
class ServicesRepository {
    constructor() {
        this.reference = () => connection(SERVICES_TABLE_NAME);
        this.create = ({ serviceName, update_time }) => __awaiter(this, void 0, void 0, function* () {
            return this.reference()
                .insert({
                service_name: serviceName,
                update_time
            })
                .then(() => {
                return;
            })
                .catch(error => {
                throw new handleError_1.AppError('Database Error', 406, error.message, true);
            });
        });
        this.index = ({ update_time }) => __awaiter(this, void 0, void 0, function* () {
            let query = this.reference();
            if (!!update_time) {
                query = query.where('update_time', '=', update_time);
            }
            return query
                .select('*')
                .then(services => services)
                .catch(error => {
                throw new handleError_1.AppError('Database Error', 406, error.message, true);
            });
        });
        this.update = ({ id, update_time }) => __awaiter(this, void 0, void 0, function* () {
            return this.reference()
                .where('id', '=', id)
                .where('update_time', '=', update_time)
                .update({
                update_time: update_time
            })
                .then(() => {
                return;
            })
                .catch(error => {
                throw new handleError_1.AppError('Database Error', 406, error.message, true);
            });
        });
        this.delete = (id) => __awaiter(this, void 0, void 0, function* () {
            return this.reference()
                .where('id', '=', id)
                .del()
                .then(() => {
                return;
            })
                .catch(error => {
                throw new handleError_1.AppError('Database Error', 406, error.message, true);
            });
        });
    }
}
exports.default = ServicesRepository;
