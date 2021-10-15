import { Knex } from 'knex'

import { AppError } from './../utils/handleError'
const connection: Knex<any, unknown[]> = require('./../database')
const { MONITORING_TABLE_NAME } = require('./../database/types')

export interface monitoringInterface {
  id: number,

  name: string
  content: string
}

export interface createMonitoringInterface {
  name: string,
  content: string
}

export interface updateMonitoringInterface {
  name: string,
  content: string
}

export interface getMonitoringInterface {
  name: string
}

export default class MonitoringRepository {
  private reference = () => connection<monitoringInterface>(MONITORING_TABLE_NAME)

  public create = async ({ name, content }: createMonitoringInterface) => {
    return this.reference()
      .insert({
        name,
        content
      })
        .then(() => {
          return
        })
        .catch(error => {
          throw new AppError('Database Error', 406, error.message, true)
        })
  }

  public index = async () => {
    return this.reference()
      .select('*')
      .then(monitoring => monitoring)
      .catch(error => {
        throw new AppError('Database Error', 406, error.message, true)
      })
  }

  public get = async ({ name }: getMonitoringInterface) => {
    return this.reference()
      .where('name', '=', name)
      .select('*')
      .first()
      .then(monitoring => monitoring)
      .catch(error => {
        throw new AppError('Database Error', 406, error.message, true)
      })
  }

  public update = async ({ name, content }: updateMonitoringInterface) => {
    return this.reference()
      .where('name', '=', name)
      .first()
      .update({
        content
      })
        .then(() => {
          return
        })
        .catch(error => {
          throw new AppError('Database Error', 406, error.message, true)
        })
  }
}