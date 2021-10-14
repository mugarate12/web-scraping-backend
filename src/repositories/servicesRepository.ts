import { Knex } from 'knex'

import { AppError } from './../utils/handleError'
const connection: Knex<any, unknown[]> = require('./../database')
const { SERVICES_TABLE_NAME } = require('./../database/types')

export interface serviceInterface {
  id: number, 

  service_name: string,
  update_time: number
}

export interface createServiceInterface {
  serviceName: string,
  update_time: number
}

export interface indexServiceInterface {
  update_time?: number
}

export interface updateServiceInterface {
  id: number,
  update_time: number
}

export default class ServicesRepository {
  private reference = () => connection<serviceInterface>(SERVICES_TABLE_NAME)

  public create = async ({ serviceName, update_time }: createServiceInterface) => {
    return this.reference()
      .insert({
        service_name: serviceName,
        update_time
      })
      .then(() => {
        return
      })
      .catch(error => {
        throw new AppError('Database Error', 406, error.message, true)
      })
  }

  public index = async ({ update_time }: indexServiceInterface) => {
    let query = this.reference()

    if (!!update_time) {
      query = query.where('update_time', '=', update_time)
    }

    return query
      .select('*')
      .then(services => services)
      .catch(error => {
        throw new AppError('Database Error', 406, error.message, true)
      })
  }

  public update = async ({ id, update_time }: updateServiceInterface) => {
    return this.reference()
      .where('id', '=', id)
      .where('update_time', '=', update_time)
      .update({
        update_time: update_time
      })
      .then(() => {
        return
      })
      .catch(error => {
        throw new AppError('Database Error', 406, error.message, true)
      })
  }

  public delete = async (id: number) => {
    return this.reference()
      .where('id', '=', id)
      .del()
      .then(() => {
        return
      })
      .catch(error => {
        throw new AppError('Database Error', 406, error.message, true)
      })
  }
}