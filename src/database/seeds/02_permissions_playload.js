const {
  PERMISSIONS_TABLE_NAME
} = require('./../types')

// identifier: string
async function createAccessIdentifier(identifier, knex) {
  await knex(PERMISSIONS_TABLE_NAME)
    .where({ identifier: identifier })
    .select('*')
    .then(async (permission) => {
      const notHavePermission = permission.length === 0

      if (notHavePermission) {
        await knex(PERMISSIONS_TABLE_NAME)
          .insert({
            identifier
          })
      }
    })
}

exports.seed = async function seed(knex) {
  await createAccessIdentifier('ACCESS_SERVICES_CREATION', knex)
  await createAccessIdentifier('ACCESS_SERVICES_VIEW', knex)

  await createAccessIdentifier('ACCESS_USERS_CREATION', knex)
  await createAccessIdentifier('ACCESS_USERS_VIEW', knex)
  
  await createAccessIdentifier('ACCESS_API_ACCESS_CREATION', knex)
  await createAccessIdentifier('ACCESS_API_ACCESS_VIEW', knex)
  
  await createAccessIdentifier('ACCESS_API_FLOW4DETECTOR_DATA', knex)
  await createAccessIdentifier('ACCESS_API_FLOW4ENERGY_DATA', knex)
}