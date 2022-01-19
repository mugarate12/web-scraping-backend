const {
  OCR_DATA_TABLE_NAME
} = require('./../types')

exports.up = function(knex) {
  return knex.schema.createTable(OCR_DATA_TABLE_NAME, (table) => {
    table.increments('id').notNullable()

    table.string('state', 191).notNullable()
    table.string('city', 191).notNullable()
    
    table.string('service', 191).notNullable()
    table.string('up_value', 191).notNullable()
    table.string('up_percent', 191).notNullable()
    table.string('down_value', 191).notNullable()
    table.string('down_percent', 191).notNullable()

    table.collate('utf8_general_ci')
  })
}

exports.down = function(knex) {
  return knex.schema.dropTable(OCR_DATA_TABLE_NAME)
}
