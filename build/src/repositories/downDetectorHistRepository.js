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
const { DOWN_DETECTOR_HIST_TABLE_NAME } = require('./../database/types');
class DownDetectorHistRepository {
    constructor() {
        this.reference = () => connection(DOWN_DETECTOR_HIST_TABLE_NAME);
        this.create = ({ site_d, hist_date, baseline, notification_count }) => __awaiter(this, void 0, void 0, function* () {
            return this.reference()
                .insert({
                site_d,
                hist_date,
                baseline,
                notification_count
            })
                .then(() => {
                return;
            })
                .catch(error => {
                throw new handleError_1.AppError('Database Error', 406, error.message, true);
            });
        });
        this.index = ({ serviceURL }) => __awaiter(this, void 0, void 0, function* () {
            let query = this.reference();
            if (!!serviceURL) {
                query = query.where('site_d', '=', serviceURL);
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
exports.default = DownDetectorHistRepository;
