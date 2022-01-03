import { Knex } from 'knex'

import { AppError } from './../utils/handleError'
const connection: Knex<any, unknown[]> = require('./../database')
const { CLIENTS_ACCESS_TABLE_NAME } = require('./../database/types')

interface clientAccessInterface {
  id: number,
  client_FK: number,
  permission_FK: number
}

interface createClientAccessInterface {
  client_FK: number,
  permissions: Array<number>,
}

interface getClientAccessInterface {
  id?: number,
  client_FK?: number,
  permission_FK?: number
}

interface deleteClientAccessInterface {
  client_FK: number,
  permission_FK?: number
}

export default class ClientsAccessRepository {
  private reference = () => connection<clientAccessInterface>(CLIENTS_ACCESS_TABLE_NAME)

  public create = async ({ client_FK, permissions } : createClientAccessInterface) => {
    const payload = permissions.map(permission => {
      return {
        client_FK: client_FK,
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
    client_FK,
    permission_FK
  }: getClientAccessInterface) => {
    let query = this.reference()

    if (!!id) {
      query = query.where('id', '=', id)
    }

    if (!!permission_FK) {
      query = query.where('permission_FK', '=', permission_FK)
    }
    
    if (!!client_FK) {
      query = query.where('client_FK', '=', client_FK)
    }

    return query
      .first()
      .select('*')
      .then(userAccess => userAccess)
      .catch(error => {
        throw new AppError('Database Error', 406, error.message, true)
      })
  }

  public index = async (clientID?: number) => {
    let query = this.reference()

    if (!!clientID) {
      query = query
        .where('client_FK', '=', clientID)
    }

    return query
      .select('*')
      .then(usersAccess => usersAccess)
      .catch(error => {
        throw new AppError('Database Error', 406, error.message, true)
      })
  }

  public delete = async ({
    client_FK,
    permission_FK
  }: deleteClientAccessInterface) => {
    let query = this.reference()

    if (!!permission_FK) {
      query = query
        .where('permission_FK', '=', permission_FK)
    }

    return query
      .where('client_FK', '=', client_FK)
      .delete()
      .then(() => {
        return
      })
      .catch(error => {
        throw new AppError('Database Error', 406, error.message, true)
      })
  }
}