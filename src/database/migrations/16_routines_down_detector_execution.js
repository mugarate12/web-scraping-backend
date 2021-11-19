const {
  DOWN_DETECTOR_ROUTINE_EXECUTION
} = require('./../types')

exports.up = function(knex) {
  return knex.schema.createTable(DOWN_DETECTOR_ROUTINE_EXECUTION, (table) => {
    table.increments('id').notNullable()

    table.integer('time').notNullable()
    table.integer('execution').notNullable()
  })
}

exports.down = function(knex) {
  return knex.schema.dropTable(DOWN_DETECTOR_ROUTINE_EXECUTION)
}