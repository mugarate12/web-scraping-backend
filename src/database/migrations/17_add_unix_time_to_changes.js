const {
  DOWN_DETECTOR_CHANGE_TABLE_NAME
} = require('./../types')

exports.up = async function(knex) {
  await knex.schema.hasColumn(DOWN_DETECTOR_CHANGE_TABLE_NAME, 'dateUnixTime').then(exists => {
    if (!exists) {
      knex.schema.alterTable(DOWN_DETECTOR_CHANGE_TABLE_NAME, async (table) => {
         table.string('dateUnixTime').nullable()
      })
    }
  })

  const changes = await knex(DOWN_DETECTOR_CHANGE_TABLE_NAME)
    .select('*')
    .then(changes => changes)

  for (let index = 0; index < changes.length; index++) {
    const change = changes[index]

    await knex(DOWN_DETECTOR_CHANGE_TABLE_NAME)
      .where({
        id: change.id
      })
      .update({
        dateUnixTime: Math.round((new Date(change.hist_date)).getTime() / 1000)
      })
  }
}

exports.down = function(knex) {
}