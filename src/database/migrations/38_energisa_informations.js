const {
	ENERGISA_INFORMATIONS_TABLE_NAME
} = require('./../types')

exports.up = async function(knex) {
	await knex.schema.createTable(ENERGISA_INFORMATIONS_TABLE_NAME, (table) => {
		table.increments('id').notNullable()

    table.string('state_name').notNullable()
    table.string('state_cod').notNullable()
    table.string('city_name').notNullable()
    table.string('city_cod').notNullable()
	})
}

exports.down = function(knex) {
	return knex.schema.dropTable(ENERGISA_INFORMATIONS_TABLE_NAME)
}