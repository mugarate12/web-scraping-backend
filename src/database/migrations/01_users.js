const {
  USERS_TABLE_NAME
} = require('./../types')

exports.up = function(knex) {
  return knex.schema.createTable(USERS_TABLE_NAME, (table) => {
    table.increments('id').notNullable()

    table.string('login', 191).unique().notNullable()
    table.string('password', 191).notNullable()
  })
}

exports.down = function(knex) {
  return knex.schema.dropTable(USERS_TABLE_NAME)
}
