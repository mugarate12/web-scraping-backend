const {
  CPFL_DATA
} = require('./../types')

exports.up = async function(knex) {
  return knex.schema.alterTable(CPFL_DATA, (table) => {
     table.string('reason').nullable()
  })
}

exports.down = function(knex) {
}