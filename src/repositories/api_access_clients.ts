import { Knex } from 'knex'

import { AppError } from './../utils/handleError'
const connection: Knex<any, unknown[]> = require('./../database')
const { 
  API_ACCESS_CLIENTS_TABLE_NAME,
  ENERGY_PERMISSIONS_TABLE_NAME,
  CPFL_SEARCH
} = require('./../database/types')

interface apiAccessClientsInterface {
  id: number,
  identifier: string,
  able: number,
  expiration_time: string
}

interface createApiAccessClientInterface {
  identifier: string,
  expiration_time?: string,
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
    able?: number,
    expiration_time?: string,
  }
}

interface deleteApiAccessClient {
  id: number
}

export default class ApiAccessClientsRepository {
  private reference = () => connection<apiAccessClientsInterface>(API_ACCESS_CLIENTS_TABLE_NAME)

  public create = async ({ identifier, expiration_time }: createApiAccessClientInterface) => {
    let payload = {}

    payload['identifier'] = identifier
    if (!!expiration_time) payload['expiration_time'] = expiration_time
    
    return this.reference()
      .insert({
        ...payload
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

      if (!!payload.expiration_time) updatePayload['expiration_time'] = payload.expiration_time

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