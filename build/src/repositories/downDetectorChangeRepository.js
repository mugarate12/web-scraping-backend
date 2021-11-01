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
const { DOWN_DETECTOR_CHANGE_TABLE_NAME } = require('./../database/types');
class DownDetectorChangeRepository {
    constructor() {
        this.reference = () => connection(DOWN_DETECTOR_CHANGE_TABLE_NAME);
        this.create = ({ site_c, hist_date, status_atual, status_anterior, status_change }) => __awaiter(this, void 0, void 0, function* () {
            return this.reference()
                .insert({
                site_c,
                hist_date,
                status_atual,
                status_anterior,
                status_change
            })
                .then(() => {
                return;
            })
                .catch(error => {
                throw new handleError_1.AppError('Database Error', 406, error.message, true);
            });
        });
        this.index = ({ identifiers, orderBy, limit }) => __awaiter(this, void 0, void 0, function* () {
            let query = this.reference();
            if (!!identifiers) {
                if (!!identifiers.serviceURL) {
                    query = query.where('site_c', '=', identifiers.serviceURL);
                }
            }
            if (!!orderBy) {
                query = query.orderBy(orderBy.property, orderBy.orientation);
            }
            if (!!limit) {
                query = query.limit(limit);
            }
            return query
                .select('*')
                .then(downDetectorHists => downDetectorHists)
                .catch(error => {
                throw new handleError_1.AppError('Database Error', 406, error.message, true);
            });
        });
    }
}
exports.default = DownDetectorChangeRepository;
