const {
  PERMISSIONS_TABLE_NAME,
  USERS_ACCESS_TABLE_NAME,
  USERS_TABLE_NAME
} = require('./../types')

exports.up = function(knex) {
  return knex.schema.createTable(USERS_ACCESS_TABLE_NAME, (table) => {
    table.increments('id').notNullable()

    table.integer('user_FK', 11).notNullable().unsigned()
    table.integer('permission_FK', 11).notNullable().unsigned()

    table.foreign('user_FK').references('id').inTable(USERS_TABLE_NAME)
    table.foreign('permission_FK').references('id').inTable(PERMISSIONS_TABLE_NAME)
  })
}

exports.down = function(knex) {
  return knex.schema.dropTable(USERS_ACCESS_TABLE_NAME)
}