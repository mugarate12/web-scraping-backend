const {
  DOWN_DETECTOR_HIST_TABLE_NAME
} = require('./../types')

exports.up = function(knex) {
  return knex.schema.createTable(DOWN_DETECTOR_HIST_TABLE_NAME, (table) => {
    table.increments('id').notNullable()

    table.string('site_d', 300).notNullable()
    table.timestamp('hist_date').unique().notNullable()
    table.integer('baseline').notNullable()
    table.integer('notification_count').notNullable()
  })
}

exports.down = function(knex) {
  return knex.schema.dropTable(DOWN_DETECTOR_HIST_TABLE_NAME)
}
