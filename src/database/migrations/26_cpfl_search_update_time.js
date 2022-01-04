const {
  CPFL_SEARCH,
  CPFL_SEARCH_UPDATE_TIME
} = require('./../types')

exports.up = async function(knex) {
  await knex.schema.createTable(CPFL_SEARCH_UPDATE_TIME, (table) => {
    table.increments('id').notNullable()

    table.string('last_execution').nullable()
    table.integer('cpfl_search_FK', 11).notNullable().unsigned()

    table.foreign('cpfl_search_FK').references('id').inTable(CPFL_SEARCH)
  })

  const searchs = await knex(CPFL_SEARCH)
    .select('*')
    .then(searchs => searchs)

  for (let index = 0; index < searchs.length; index++) {
    const search = searchs[index]

    await knex(CPFL_SEARCH_UPDATE_TIME)
      .insert({
        cpfl_search_FK: search.id
      })
  }
}

exports.down = function(knex) {
  return knex.schema.dropTable(CPFL_SEARCH_UPDATE_TIME)
}