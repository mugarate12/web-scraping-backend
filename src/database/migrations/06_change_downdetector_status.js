const {
  DOWN_DETECTOR_CHANGE_TABLE_NAME
} = require('./../types')

exports.up = async function(knex) {
  const firstElement = await knex(DOWN_DETECTOR_CHANGE_TABLE_NAME)
    .select('*')
    .first()

  if (!!firstElement && typeof firstElement['status_atual'] === 'string') {
    // trocar o valor dos status em branco da primeira consulta
    await knex(DOWN_DETECTOR_CHANGE_TABLE_NAME)
      .where('status_anterior', '=', '')
      .update({
        status_anterior: '0'
      })

    
    // trocar os valores dos status do campo status_atual
    await knex(DOWN_DETECTOR_CHANGE_TABLE_NAME)
      .where('status_atual', '=', 'success')
      .update({
        status_atual: '3'
      })
    
    await knex(DOWN_DETECTOR_CHANGE_TABLE_NAME)
      .where('status_atual', '=', 'danger')
      .update({
        status_atual: '2'
      })
  
    await knex(DOWN_DETECTOR_CHANGE_TABLE_NAME)
      .where('status_atual', '=', 'warning')
      .update({
        status_atual: '1'
      })
  
    // trocar os valores dos status do campo status_anterior
    await knex(DOWN_DETECTOR_CHANGE_TABLE_NAME)
      .where('status_anterior', '=', 'success')
      .update({
        status_anterior: '3'
      })
  
    await knex(DOWN_DETECTOR_CHANGE_TABLE_NAME)
      .where('status_anterior', '=', 'danger')
      .update({
        status_anterior: '2'
      })
  
    await knex(DOWN_DETECTOR_CHANGE_TABLE_NAME)
      .where('status_anterior', '=', 'warning')
      .update({
        status_anterior: '1'
      })
  }
    
  await knex.raw(`alter TABLE ${DOWN_DETECTOR_CHANGE_TABLE_NAME} MODIFY status_anterior int`)
  await knex.raw(`alter TABLE ${DOWN_DETECTOR_CHANGE_TABLE_NAME} MODIFY status_atual int`)
}

exports.down = function(knex) {
  // return knex.schema.dropTable(DOWN_DETECTOR_CHANGE_TABLE_NAME)
}
