"use strict";
const { DOWN_DETECTOR_CHANGE_TABLE_NAME } = require('./../types');
exports.up = function (knex) {
    return knex.schema.createTable(DOWN_DETECTOR_CHANGE_TABLE_NAME, (table) => {
        table.increments('id').notNullable();
        table.string('site_c', 300).notNullable();
        table.timestamp('hist_date').notNullable();
        table.string('status_atual').notNullable();
        table.string('status_anterior').notNullable();
        table.string('status_change').notNullable();
    });
};
exports.down = function (knex) {
    return knex.schema.dropTable(DOWN_DETECTOR_CHANGE_TABLE_NAME);
};
