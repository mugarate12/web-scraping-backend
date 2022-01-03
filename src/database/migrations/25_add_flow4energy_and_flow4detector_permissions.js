const {
  API_ACCESS_CLIENTS_TABLE_NAME,
  CLIENTS_ACCESS_TABLE_NAME,

  PERMISSIONS_TABLE_NAME
} = require('./../types')

exports.up = async function (knex) {
  const clients = await knex(API_ACCESS_CLIENTS_TABLE_NAME)
    .select('*')
    .then(clients => clients)

  const permissions = await knex(PERMISSIONS_TABLE_NAME)
    .where('identifier', '=', 'ACCESS_API_FLOW4DETECTOR_DATA')
    .orWhere('identifier', '=', 'ACCESS_API_FLOW4ENERGY_DATA')
    .select('*')
    .then(permissions => permissions)


  for (let index = 0; index < clients.length; index++) {
    const client = clients[index]

    for (let index = 0; index < permissions.length; index++) {
      const permission = permissions[index]
      
      const access_client = await knex(CLIENTS_ACCESS_TABLE_NAME)
        .where({
          client_FK: client.id,
          permission_FK: permission.id
        })
        .select('*')
        .then(access_client => access_client)

      if (!!access_client) {
        await knex(CLIENTS_ACCESS_TABLE_NAME)
          .insert({
            client_FK: client.id,
            permission_FK: permission.id
          })
      }
    }
  }
}

exports.down = function(knex) {}