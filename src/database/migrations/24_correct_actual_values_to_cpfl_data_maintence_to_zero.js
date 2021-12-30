const {
  CPFL_DATA
} = require('./../types')

exports.up = async function(knex) {
  const finalSecondsChanges = await knex(CPFL_DATA)
    .where('final_seconds', '<', 0)
    .select('*')
    .then(changes => changes)
  
  const finalMaintenanceChanges = await knex(CPFL_DATA)
    .where('final_maintenance', '<', 0)
    .select('*')
    .then(changes => changes)

  for (let index = 0; index < finalSecondsChanges.length; index++) {
    const change = finalSecondsChanges[index]
    
    knex(CPFL_DATA)
      .where('id', '=', change.id)
      .update({
        final_seconds: 0
      })
  }
  
  for (let index = 0; index < finalSecondsChanges.length; index++) {
    const change = finalMaintenanceChanges[index]
    
    knex(CPFL_DATA)
      .where('id', '=', change.id)
      .update({
        final_maintenance: 0
      })
  }
}

exports.down = function(knex) {}