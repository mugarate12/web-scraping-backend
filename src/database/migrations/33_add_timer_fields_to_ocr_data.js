const {
  OCR_DATA_TABLE_NAME
} = require('./../types')


exports.up = async function(knex) {
  await knex.schema.alterTable(OCR_DATA_TABLE_NAME, (table) => {
    table.string('last_update_routine').nullable()
    table.string('last_update_page').nullable()
  })
}

exports.down = async function(knex) {
  await knex.schema.hasColumn(OCR_DATA_TABLE_NAME, 'last_update_routine').then(exists => {
    if (exists) {
      knex.schema.table(OCR_DATA_TABLE_NAME, t => t.dropColumn('last_update_routine'))
    }
  })
 
  await knex.schema.hasColumn(OCR_DATA_TABLE_NAME, 'last_update_page').then(exists => {
    if (exists) {
      knex.schema.table(OCR_DATA_TABLE_NAME, t => t.dropColumn('last_update_page'))
    }
  })
}