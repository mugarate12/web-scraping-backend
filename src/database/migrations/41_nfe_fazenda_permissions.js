const {
  API_ACCESS_CLIENTS_TABLE_NAME,
  NFE_FAZENDA_TABLE_NAME,
  NFE_FAZENDA_PERMISSIONS_TABLE_NAME
} = require('./../types')

exports.up = async function(knex) {
  await knex.schema.createTable(NFE_FAZENDA_PERMISSIONS_TABLE_NAME, (table) => {
    table.increments('id').notNullable()

    table.integer('nfe_fazenda_FK', 11).notNullable().unsigned()
    table.integer('client_FK', 11).notNullable().unsigned()

    table.foreign('nfe_fazenda_FK').references('id').inTable(NFE_FAZENDA_TABLE_NAME)
    table.foreign('client_FK').references('id').inTable(API_ACCESS_CLIENTS_TABLE_NAME)
	})
}

exports.down = function(knex) {
	return knex.schema.dropTable(NFE_FAZENDA_PERMISSIONS_TABLE_NAME)
}
