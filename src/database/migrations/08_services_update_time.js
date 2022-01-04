const {
  SERVICES_UPDATE_TIME_TABLE_NAME
} = require('./../types')

exports.up = function(knex) {
  return knex.schema.createTable(SERVICES_UPDATE_TIME_TABLE_NAME, (table) => {
    table.increments('id').notNullable()
    
    table.integer('routine').notNullable()
    table.timestamp('last_execution').notNullable()
  })
}

exports.down = function(knex) {
  return knex.schema.dropTable(SERVICES_UPDATE_TIME_TABLE_NAME)
}