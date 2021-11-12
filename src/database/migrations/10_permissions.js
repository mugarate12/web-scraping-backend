const {
  PERMISSIONS_TABLE_NAME
} = require('./../types')

exports.up = function(knex) {
  return knex.schema.createTable(PERMISSIONS_TABLE_NAME, (table) => {
    table.increments('id').notNullable()

    table.string('identifier', 191).unique().notNullable()
  })
}

exports.down = function(knex) {
  return knex.schema.dropTable(PERMISSIONS_TABLE_NAME)
}