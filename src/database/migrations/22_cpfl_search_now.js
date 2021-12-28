const {
  CPFL_SEARCH_NOW
} = require('./../types')

exports.up = function(knex) {
  return knex.schema.createTable(CPFL_SEARCH_NOW, (table) => {
    table.increments('id').notNullable()

    table.string('state', 191).notNullable()
    table.string('city', 191).unique().notNullable()
  })
}

exports.down = function(knex) {
  return knex.schema.dropTable(CPFL_SEARCH_NOW)
}
