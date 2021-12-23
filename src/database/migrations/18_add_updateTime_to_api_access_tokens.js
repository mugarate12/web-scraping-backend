const {
  API_ACCESS_TOKENS_TABLE_NAME
} = require('./../types')

exports.up = async function(knex) {
  await knex.schema.hasColumn(API_ACCESS_TOKENS_TABLE_NAME, 'last_execution').then(exists => {
    if (!exists) {
      knex.schema.alterTable(API_ACCESS_TOKENS_TABLE_NAME, (table) => {
        table.timestamp('last_execution').nullable()
      })
    }
  })
}

exports.down = async function(knex) {
  return await knex.schema.hasColumn(API_ACCESS_TOKENS_TABLE_NAME, 'last_execution').then(exists => {
    if (exists) {
      knex.schema.table(API_ACCESS_TOKENS_TABLE_NAME, t => t.dropColumn('last_execution'));
    }
  })
}
