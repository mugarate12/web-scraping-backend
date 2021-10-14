const {
  SERVICES_TABLE_NAME
} = require('./../types')

exports.up = function(knex) {
  return knex.schema.createTable(SERVICES_TABLE_NAME, (table) => {
    table.increments('id').notNullable()

    table.string('service_name').unique().notNullable()
  })
}

exports.down = function(knex) {
  return knex.schema.dropTable(SERVICES_TABLE_NAME)
}
