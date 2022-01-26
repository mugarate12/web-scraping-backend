const {
	API_ACCESS_CLIENTS_TABLE_NAME,
	OCR_PERMISSIONS
} = require('./../types')

exports.up = async function(knex) {
	await knex.schema.createTable(OCR_PERMISSIONS, (table) => {
		table.increments('id').notNullable()

		table.integer('client_FK', 11).notNullable().unsigned()
    table.string('state').notNullable()
    table.string('city').notNullable()
    table.string('pix_name').notNullable()

		table.foreign('client_FK').references('id').inTable(API_ACCESS_CLIENTS_TABLE_NAME)
	})
}

exports.down = function(knex) {
	return knex.schema.dropTable(OCR_PERMISSIONS)
}