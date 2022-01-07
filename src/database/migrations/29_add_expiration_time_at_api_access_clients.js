const {
  API_ACCESS_CLIENTS_TABLE_NAME
} = require('./../types')


exports.up = async function(knex) {
  await knex.schema.alterTable(API_ACCESS_CLIENTS_TABLE_NAME, (table) => {
    table.string('expiration_time').nullable()
  })

  await knex(API_ACCESS_CLIENTS_TABLE_NAME)
    .update({
      expiration_time: 'undefined'
    })
}

exports.down = async function(knex) {
  await knex.schema.hasColumn(API_ACCESS_CLIENTS_TABLE_NAME, 'expiration_time').then(exists => {
    if (exists) {
      knex.schema.table(API_ACCESS_CLIENTS_TABLE_NAME, t => t.dropColumn('expiration_time'))
    }
  })
}