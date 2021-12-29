const {
  CPFL_SEARCH
} = require('./../types')

exports.up = async function(knex) {
  await knex.schema.alterTable(CPFL_SEARCH, (table) => {
    table.string('dealership').nullable()
    table.integer('update_time').nullable()
  })

  const searchs = await knex(CPFL_SEARCH)
    .select('*')
    .then((searchs => searchs))

  for (let index = 0; index < searchs.length; index++) {
    const search = searchs[index]
    
    await knex(CPFL_SEARCH)
      .where({ id: search.id })
      .update({
        dealership: 'cpfl',
        update_time: 15
      })
  }
}

exports.down = function(knex) {
}
