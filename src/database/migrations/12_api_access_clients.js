const {
  API_ACCESS_CLIENTS_TABLE_NAME
} = require('./../types')

exports.up = function(knex) {
  return knex.schema.createTable(API_ACCESS_CLIENTS_TABLE_NAME, (table) => {
    table.increments('id').notNullable()

    table.string('identifier', 191).unique().notNullable()
  })
}

exports.down = function(knex) {
  return knex.schema.dropTable(API_ACCESS_CLIENTS_TABLE_NAME)
}