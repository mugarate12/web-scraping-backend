const {
	OCR_SERVICES
} = require('./../types')

exports.up = async function(knex) {
	await knex.schema.createTable(OCR_SERVICES, (table) => {
		table.increments('id').notNullable()

    table.string('pix_name').notNullable()
    table.string('state').notNullable()
    table.string('city').notNullable()

    table.integer('able').notNullable()
	})
}

exports.down = function(knex) {
	return knex.schema.dropTable(OCR_SERVICES)
}