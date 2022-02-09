const {
	HOSTS_PERFIS_TABLE_NAME
} = require('./../types')

exports.up = async function(knex) {
	await knex.schema.createTable(HOSTS_PERFIS_TABLE_NAME, (table) => {
		table.increments('id').notNullable()

    table.string('name', 191).unique().notNullable()
    table.string('user').notNullable()
    table.string('password').notNullable()
    // zabbix link
    table.string('url').notNullable()
    table.string('worksheet_link').notNullable()

	})
}

exports.down = function(knex) {
	return knex.schema.dropTable(HOSTS_PERFIS_TABLE_NAME)
}