const {
	CPFL_DATA
} = require('./../types')

exports.up = async function(knex) {
	await knex(CPFL_DATA)
		.where({ status: 4 })
		.update({
			final_seconds: 0,
			final_maintenance: 0
		})
}

exports.down = function(knex) {
}