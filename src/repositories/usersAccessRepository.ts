import { Knex } from 'knex'

import { AppError } from './../utils/handleError'
const connection: Knex<any, unknown[]> = require('./../database')
const { USERS_ACCESS_TABLE_NAME } = require('./../database/types')

interface userAccessInterface {
  id: number,
  user_FK: number,
  permission_FK: number
}

interface createUserAccessInterface {
  user_FK: number,
  permissions: Array<number>,
}

interface getUserAccessInterface {
  id?: number,
  user_FK?: number,
  permission_FK?: number
}

interface removeUserAccessInterface {
  id?: number,
  userID?: number
}

export default class UsersAccessRepository {
  private reference = () => connection<userAccessInterface>(USERS_ACCESS_TABLE_NAME)

  public create = async ({ user_FK, permissions } : createUserAccessInterface) => {
    const payload = permissions.map(permission => {
      return {
        user_FK: user_FK,
        permission_FK: permission
      }
    })

    return await this.reference()
      .insert(payload)
      .then(() => {
        return
      })
      .catch(error => {
        throw new AppError('Database Error', 406, error.message, true)
      })
  }

  public get = async ({
    id,
    user_FK,
    permission_FK
  }: getUserAccessInterface) => {
    let query = this.reference()

    if (!!id) {
      query = query.where('id', '=', id)
    }

    if (!!permission_FK) {
      query = query.where('permission_FK', '=', permission_FK)
    }
    
    if (!!user_FK) {
      query = query.where('user_FK', '=', user_FK)
    }

    return query
      .first()
      .select('*')
      .then(userAccess => userAccess)
      .catch(error => {
        throw new AppError('Database Error', 406, error.message, true)
      })
  }

  public index = async () => {
    let query = this.reference()

    return query
      .select('*')
      .then(usersAccess => usersAccess)
      .catch(error => {
        throw new AppError('Database Error', 406, error.message, true)
      })
  }

  public delete = async ({
    id,
    userID
  }: removeUserAccessInterface) => {
    let query = this.reference()

    if (!!id) {
      query = query
        .where('id', '=', id)
    }

    if (!!userID) {
      query = query
        .where('user_FK', '=', userID)
    }

    return query
      .delete()
      .then(() => {
        return
      })
      .catch(error => {
        throw new AppError('Database Error', 406, error.message, true)
      })
  }
}