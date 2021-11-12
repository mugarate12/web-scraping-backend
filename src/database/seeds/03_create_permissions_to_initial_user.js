const {
  PERMISSIONS_TABLE_NAME,
  USERS_ACCESS_TABLE_NAME,
  USERS_TABLE_NAME
} = require('./../types')

function createArrayOfPermissionsPayload(userID, permissions) {
  return permissions.map((permission) => {
    return {
      'user_FK': userID,
      'permission_FK': permission.id
    }
  })
}

async function createPermissionInDatabase(payload, knex) {
  await knex(USERS_ACCESS_TABLE_NAME)
    .where({
      user_FK: payload.user_FK,
      permission_FK: payload.permission_FK
    })
    .select('*')
    .then(async (access_user) => {
      const notHaveAccess = access_user.length === 0

      if (notHaveAccess) {
        await knex(USERS_ACCESS_TABLE_NAME)
          .insert({
            user_FK: payload.user_FK,
            permission_FK: payload.permission_FK
          })
      }
    })

}

async function createPermissionsToUser(permissions, user, knex) {
  if (user.length !== 0) {
    const userID = user[0].id
    const payloadArray = createArrayOfPermissionsPayload(userID, permissions) 

    const requestsOfCreatePermissions = payloadArray.map(async (payload) => {
      await createPermissionInDatabase(payload, knex)
    })

    await Promise.all(requestsOfCreatePermissions)
  }
}

exports.seed = async function seed(knex) {
  const permissions = await knex(PERMISSIONS_TABLE_NAME)
    .select('*')
    .then(permissions => permissions)
  
  const user = await knex(USERS_TABLE_NAME)
    .where({ id: 1 })
    .select('*')
    .then(user => user)

  await createPermissionsToUser(permissions, user, knex)
}