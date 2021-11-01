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
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const { USERS_TABLE_NAME } = require('./../types');
dotenv.config();
exports.seed = function seed(knex) {
    return __awaiter(this, void 0, void 0, function* () {
        const salt = yield bcrypt.genSalt();
        const pw = yield bcrypt.hash(process.env.ADMIN_PASSWORD || '', salt);
        yield knex(USERS_TABLE_NAME)
            .where({ id: 1 })
            .select('*')
            .then((user) => __awaiter(this, void 0, void 0, function* () {
            const notHaveUser = user.length === 0;
            if (notHaveUser) {
                yield knex(USERS_TABLE_NAME).insert([
                    {
                        id: 1,
                        login: process.env.ADMIN_LOGIN,
                        password: pw,
                    }
                ]);
            }
        }));
    });
};
