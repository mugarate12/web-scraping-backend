const {
  API_ACCESS_CLIENTS_TABLE_NAME
} = require('./../types')

exports.up = function(knex) {
  return knex.schema.alterTable(API_ACCESS_CLIENTS_TABLE_NAME, (table) => {
    table.integer('able').notNullable().defaultTo(1)
  })
}

exports.down = function(knex) {
}