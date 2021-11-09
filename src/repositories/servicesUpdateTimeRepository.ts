import { Knex } from 'knex'
import moment from 'moment'

import { AppError } from './../utils/handleError'
const connection: Knex<any, unknown[]> = require('./../database')
const { SERVICES_UPDATE_TIME_TABLE_NAME } = require('./../database/types')

interface servicesUpdateTimeInterface {
  id: number,
  routine: number,
  last_execution: string
}

interface createServiceUpdateTime {
  routine: number
}

interface getServiceUpdateTime {
  routine: number
}

interface updateIdentifiers {
  routine: number
}

export default class ServicesUpdateTimeRepository {
  private reference = () => connection<servicesUpdateTimeInterface>(SERVICES_UPDATE_TIME_TABLE_NAME)

  public create = async ({ routine }: createServiceUpdateTime) => {
    const date = moment().format('YYYY-MM-DD HH:mm:ss')
    
    return this.reference()
      .insert({
        last_execution: date,
        routine
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
      .orderBy('routine', 'asc')
      .select('*')
      .then(routines => routines)
      .catch(error => {
        throw new AppError('Database Error', 406, error.message, true)
      })
  }

  public get = async ({ routine }: getServiceUpdateTime) => {
    return this.reference()
      .where('routine', '=', routine)
      .first()
      .then(service => service)
      .catch(error => {
        throw new AppError('Database Error', 406, error.message, true)
      })
  }

  public update = async ({ routine }: updateIdentifiers) => {
    const date = moment().format('YYYY-MM-DD HH:mm:ss')

    return this.reference()
      .where('routine', '=', routine)
      .update({
        last_execution: date
      })
      .then(() => {
        return
      })
      .catch(error => {
        throw new AppError('Database Error', 406, error.message, true)
      })
  }
}