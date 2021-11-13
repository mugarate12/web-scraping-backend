const {
  API_ACCESS_CLIENTS_TABLE_NAME,
  CLIENTS_ACCESS_TABLE_NAME,
  PERMISSIONS_TABLE_NAME
} = require('./../types')

exports.up = function(knex) {
  return knex.schema.createTable(CLIENTS_ACCESS_TABLE_NAME, (table) => {
    table.increments('id').notNullable()

    table.integer('client_FK', 11).notNullable().unsigned()
    table.integer('permission_FK', 11).notNullable().unsigned()

    table.foreign('client_FK').references('id').inTable(API_ACCESS_CLIENTS_TABLE_NAME)
    table.foreign('permission_FK').references('id').inTable(PERMISSIONS_TABLE_NAME)
  })
}

exports.down = function(knex) {
  return knex.schema.dropTable(CLIENTS_ACCESS_TABLE_NAME)
}