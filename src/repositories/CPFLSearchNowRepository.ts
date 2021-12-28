import { Knex } from 'knex'
import moment from 'moment'

import { AppError } from './../utils/handleError'
const connection: Knex<any, unknown[]> = require('./../database')
const { 
  CPFL_SEARCH_NOW
} = require('./../database/types')

export interface CPFLSearchNowInterface {
  id: number,
  state: string,
  city: string
}

interface createCPFLSearchNowInterface {
  state: string,
  city: string
}

interface indexCPFLSearchNowInterface {
  state?: string,
  city?: string
}

interface deleteCPFLSearchNowInterface {
  state: string,
  city: string
}

export default class CPFLSearchNowRepository {
  private reference = () => connection<CPFLSearchNowInterface>(CPFL_SEARCH_NOW)

  public create = async ({ city, state }: createCPFLSearchNowInterface) => {
    return await this.reference()
      .insert({
        city,
        state,
      })
      .then(() => {
        return
      })
      .catch(error => {
        throw new AppError('Database Error', 406, error.message, true)
      })
  }

  public index = async () => {
    let query = this.reference()

    return await query
      .select('*')
      .then(searchs => searchs)
      .catch(error => {
        throw new AppError('Database Error', 406, error.message, true)
      })
  }

  public delete = async ({ state, city }: deleteCPFLSearchNowInterface) => {
    return await this.reference()
      .where({
        state,
        city
      })
      .delete()
      .then(() => {
        return
      })
      .catch(error => {
        throw new AppError('Database Error', 406, error.message, true)
      })
  }
}