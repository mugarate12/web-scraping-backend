const {
  EQUATORIAL_DATA
} = require('./../types')

exports.up = function(knex) {
  return knex.schema.createTable(EQUATORIAL_DATA, (table) => {
    table.increments('id').notNullable()

    table.string('state', 191).notNullable()
    table.string('city', 191).notNullable()
    table.string('district').notNullable()
    table.string('street').notNullable()
    
    table.integer('status').notNullable()
    
    table.string('date').notNullable()
    table.string('initial_hour').notNullable()
    table.string('final_hour').notNullable()

    table.integer('duration').notNullable()
    table.integer('final_seconds').notNullable()
    table.integer('final_maintenance').notNullable()

    table.string('reason').notNullable()
    table.integer('affected_clients').notNullable()
  })
}

exports.down = function(knex) {
  return knex.schema.dropTable(EQUATORIAL_DATA)
}