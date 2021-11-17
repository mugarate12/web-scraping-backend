import { Knex } from 'knex'

import { AppError } from './../utils/handleError'
const connection: Knex<any, unknown[]> = require('./../database')
const { API_ACCESS_CLIENTS_TABLE_NAME } = require('./../database/types')

interface apiAccessClientsInterface {
  id: number,
  identifier: string,
  able: number
}

interface createApiAccessClientInterface {
  identifier: string
}

interface getApiAccessClientsInterface {
  id?: number,
  identifier?: string
}

interface updateApiAccessClientsInterface {
  identifiers: {
    id?: number,
    identifier?: string
  },
  payload: {
    identifier?: string,
    able?: number
  }
}

interface deleteApiAccessClient {
  id: number
}

export default class ApiAccessClientsRepository {
  private reference = () => connection<apiAccessClientsInterface>(API_ACCESS_CLIENTS_TABLE_NAME)

  public create = async ({ identifier }: createApiAccessClientInterface) => {
    return this.reference()
      .insert({
        identifier
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
  }: getApiAccessClientsInterface) => {
    let query = this.reference()

    if (!!id) {
      query = query.where('id', '=', id)
    }

    if (!!identifier) {
      query = query.where('identifier', '=', identifier)
    }

    return query
      .first()
      .select('*')
      .then(client => client)
      .catch(error => {
        throw new AppError('Database Error', 406, error.message, true)
      })
  }

  public index = async () => {
    let query = this.reference()

    return query
      .select('*')
      .orderBy('id', 'asc')
      .then(permissions => permissions)
      .catch(error => {
        throw new AppError('Database Error', 406, error.message, true)
      })
  }

  public update = async ({
    identifiers,
    payload
  }: updateApiAccessClientsInterface) => {
    let query = this.reference()

    if (!!identifiers) {
      if (!!identifiers.id) {
        query = query.where('id', '=', identifiers.id)
      }

      if (!!identifiers.identifier) {
        query = query.where('identifier', '=', identifiers.identifier)
      }
    }

    if (!!payload) {
      let updatePayload = {}

      if (!!payload.identifier && payload.identifier.length > 0) {
        updatePayload['identifier'] = payload.identifier
      }

      if (!!payload.able) {
        updatePayload['able'] = payload.able
      }

      query = query.update(updatePayload)
    }

    return query
      .then(() => {
        return
      })
      .catch(error => {
        throw new AppError('Database Error', 406, error.message, true)
      })
  }

  public delete = async ({
    id
  }: deleteApiAccessClient) => {
    return this.reference()
      .where('id', '=', id)
      .delete()
      .then(() => {
        return
      })
      .catch(error => {
        throw new AppError('Database Error', 406, error.message, true)
      })
  }
}