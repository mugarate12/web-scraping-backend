import { Knex } from 'knex'

import { AppError } from './../utils/handleError'
const connection: Knex<any, unknown[]> = require('./../database')
const { 
  API_ACCESS_CLIENTS_TABLE_NAME,
  API_ACCESS_TOKENS_TABLE_NAME 
} = require('./../database/types')

interface apiAccessTokensRepository {
  id: number,
  key: string,
  api_access_client_FK: number
}

interface createApiAccessTokensRepository {
  key: string,
  api_access_client_FK: number
}

interface getPermissionInterface {
  id?: number,
  identifier?: string
}

export default class ApiAccessTokensRepository {
  private reference = () => connection<apiAccessTokensRepository>(API_ACCESS_TOKENS_TABLE_NAME)

  public create = async ({
    key,
    api_access_client_FK
  }: createApiAccessTokensRepository) => {
    return this.reference()
      .insert({
        key,
        api_access_client_FK
      })
      .then(() => {
        return
      })
      .catch(error => {
        throw new AppError('Database Error', 406, error.message, true)
      })
  }

  public get = async ({
    id,
    identifier
  }: getPermissionInterface) => {
    let query = this.reference()

    if (!!id) {
      query = query.where('id', '=', id)
    }

    if (!!identifier) {
      query = query.where('identifier', '=', identifier)
    }

    return query
      .join(API_ACCESS_CLIENTS_TABLE_NAME, `${API_ACCESS_CLIENTS_TABLE_NAME}.id`, '=', `${API_ACCESS_TOKENS_TABLE_NAME}.api_access_client_FK`)
      .select('*')
      .first()
      .then(clients => clients)
      .catch(error => {
        throw new AppError('Database Error', 406, error.message, true)
      })
  }

  public index = async () => {
    let query = this.reference()

    return query
      .join(API_ACCESS_CLIENTS_TABLE_NAME, `${API_ACCESS_CLIENTS_TABLE_NAME}.id`, '=', `${API_ACCESS_TOKENS_TABLE_NAME}.api_access_client_FK`)
      .select('*')
      // .orderBy('id', 'asc')
      .then(clients => clients)
      .catch(error => {
        throw new AppError('Database Error', 406, error.message, true)
      })
  }
}