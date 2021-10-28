const {
  MONITORING_TABLE_NAME
} = require('./../types')

exports.up = function(knex) {
  return knex.schema.createTable(MONITORING_TABLE_NAME, (table) => {
    table.increments('id').notNullable()

    table.string('name').unique().notNullable()
    table.text('content').notNullable()
  })
}

exports.down = function(knex) {
  return knex.schema.dropTable(MONITORING_TABLE_NAME)
}
