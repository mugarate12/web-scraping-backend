const {
  DOWN_DETECTOR_CHANGE_TABLE_NAME
} = require('./../types')

exports.up = async function(knex) {
  // set value 0 to initial value
  await knex(DOWN_DETECTOR_CHANGE_TABLE_NAME)
    .where('status_change', '=', 'S')
    .update({
      status_change: 0
    })
    
  await knex(DOWN_DETECTOR_CHANGE_TABLE_NAME)
    .where('status_change', '=', 'W')
    .update({
      status_change: 0
    })
    
  await knex(DOWN_DETECTOR_CHANGE_TABLE_NAME)
    .where('status_change', '=', 'D')
    .update({
      status_change: 0
    })

  // set values to Status change
  await knex(DOWN_DETECTOR_CHANGE_TABLE_NAME)
    .where('status_change', '=', 'WD')
    .update({
      status_change: 1
    })
  
  await knex(DOWN_DETECTOR_CHANGE_TABLE_NAME)
    .where('status_change', '=', 'WS')
    .update({
      status_change: 2
    })
  
  await knex(DOWN_DETECTOR_CHANGE_TABLE_NAME)
    .where('status_change', '=', 'DW')
    .update({
      status_change: 3
    })
  
  await knex(DOWN_DETECTOR_CHANGE_TABLE_NAME)
    .where('status_change', '=', 'DS')
    .update({
      status_change: 4
    })
  
  await knex(DOWN_DETECTOR_CHANGE_TABLE_NAME)
    .where('status_change', '=', 'SW')
    .update({
      status_change: 5
    })
  
  await knex(DOWN_DETECTOR_CHANGE_TABLE_NAME)
    .where('status_change', '=', 'SD')
    .update({
      status_change: 6
    })

  await knex.raw(`alter TABLE ${DOWN_DETECTOR_CHANGE_TABLE_NAME} MODIFY status_change int`)
}

exports.down = function(knex) {
}
