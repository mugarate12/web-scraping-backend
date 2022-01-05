const {
	API_ACCESS_CLIENTS_TABLE_NAME,
	CPFL_SEARCH,
	ENERGY_PERMISSIONS_TABLE_NAME
} = require('./../types')

exports.up = async function(knex) {
	await knex.schema.createTable(ENERGY_PERMISSIONS_TABLE_NAME, (table) => {
		table.increments('id').notNullable()

		table.integer('cpfl_search_FK', 11).notNullable().unsigned()
		table.integer('client_FK', 11).notNullable().unsigned()

		table.foreign('client_FK').references('id').inTable(API_ACCESS_CLIENTS_TABLE_NAME)
		table.foreign('cpfl_search_FK').references('id').inTable(CPFL_SEARCH)
	})

	const searchs = await knex(CPFL_SEARCH)
		.select('*')
		.then(searchs => searchs)

	const clients = await knex(API_ACCESS_CLIENTS_TABLE_NAME)
		.select('*')
		.then(clients => clients)

	// create all permissions to actual clients
	for (let index = 0; index < clients.length; index++) {
		const client = clients[index]
		
		for (let index = 0; index < searchs.length; index++) {
			const search = searchs[index]
			
			await knex(ENERGY_PERMISSIONS_TABLE_NAME)
				.insert({
					cpfl_search_FK: search.id,
					client_FK: client.id
				})
		}
	}
}

exports.down = function(knex) {
	return knex.schema.dropTable(ENERGY_PERMISSIONS_TABLE_NAME)
}