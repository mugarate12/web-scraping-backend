"use strict";
const { USERS_TABLE_NAME } = require('./../types');
exports.up = function (knex) {
    return knex.schema.createTable(USERS_TABLE_NAME, (table) => {
        table.increments('id').notNullable();
        table.string('login').unique().notNullable();
        table.string('password').notNullable();
    });
};
exports.down = function (knex) {
    return knex.schema.dropTable(USERS_TABLE_NAME);
};
