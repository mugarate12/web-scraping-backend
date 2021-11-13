const {
  API_ACCESS_CLIENTS_TABLE_NAME,
  API_ACCESS_TOKENS_TABLE_NAME
} = require('./../types')

exports.up = function(knex) {
  return knex.schema.createTable(API_ACCESS_TOKENS_TABLE_NAME, (table) => {
    table.increments('id').notNullable()

    table.string('key', 191).unique().notNullable()
    table.integer('api_access_client_FK', 11).notNullable().unsigned()

    table.foreign('api_access_client_FK').references('id').inTable(API_ACCESS_CLIENTS_TABLE_NAME)
  })
}

exports.down = function(knex) {
  return knex.schema.dropTable(API_ACCESS_TOKENS_TABLE_NAME)
}