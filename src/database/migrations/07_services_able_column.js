const {
  SERVICES_TABLE_NAME
} = require('./../types')

exports.up = function(knex) {
  return knex.schema.alterTable(SERVICES_TABLE_NAME, (table) => {
    table.integer('habilitado').notNullable().defaultTo(1)
  })
}

exports.down = function(knex) {
}