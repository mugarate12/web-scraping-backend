import { Knex } from 'knex'
import moment from 'moment'

import { AppError } from './../utils/handleError'
const connection: Knex<any, unknown[]> = require('./../database')
const { 
  CPFL_SEARCH
} = require('./../database/types')

export interface CPFFSearchInterface {
  id: number,
  state: string,
  city: string,
  able: number,
  dealership: string,
  update_time: number
}

interface createCPFLSearchInterface {
  state: string,
  city: string,
  dealership: string,
  update_time: number
}

interface indexCPFLSearchInterface {
  able?: number,
  state?: string,
  dealership?: string,
  update_time?: number
}

interface getCPFLSearchInterface {
  id?: number,
  state?: string,
  city?: string,
  able?: number,
  dealership?: string,
  update_time?: number
}

interface updateCPFLSearchInterface {
  id: number,
  able?: number,
  update_time?: number
}

interface deleteCPFLSearchInterface {
  id: number
}

export default class CPFLSearchRepository {
  private reference = () => connection<CPFFSearchInterface>(CPFL_SEARCH)

  public create = async ({ city, state, dealership, update_time }: createCPFLSearchInterface) => {
    return await this.reference()
      .insert({
        city,
        state,
        able: 1,
        dealership,
        update_time
      })
      .then(() => {
        return
      })
      .catch(error => {
        throw new AppError('Database Error', 406, error.message, true)
      })
  }

  public index = async ({ able, dealership, state, update_time }: indexCPFLSearchInterface) => {
    let query = this.reference()

    if (!!able) {
      query = query.where('able', '=', able)
    }

    if (!!dealership) {
      query = query.where('dealership', '=', dealership)
    }

    if (!!state) {
      query = query.where('state', '=', state)
    }

    if (!!update_time) {
      query = query.where('update_time', '=', update_time)
    }

    return await query
      .select('*')
      .then(searchs => searchs)
      .catch(error => {
        throw new AppError('Database Error', 406, error.message, true)
      })
  }

  public get = async ({ id, state, city, able, dealership, update_time }: getCPFLSearchInterface) => {
    let query = this.reference()

    if (!!id) {
      query = query.where('id', '=', id)
    }

    if (!!state) {
      query = query.where('state', '=', state)
    }

    if (!!city) {
      query = query.where('city', '=', city)
    }

    if (!!able) {
      query = query.where('able', '=', able)
    }

    if (!!dealership) {
      query = query.where('dealership', '=', dealership)
    }
    
    if (!!update_time) {
      query = query.where('update_time', '=', update_time)
    }

    return await query
      .select('*')
      .first()
      .then(search => search)
      .catch(error => {
        throw new AppError('Database Error', 406, error.message, true)
      })
  }

  public update = async ({ id, able, update_time }: updateCPFLSearchInterface) => {
    let update: {
      able?: number,
      update_time?: number
    } = {}

    if (!!able) {
      update.able = Number(able)
    }

    if (!!update_time) {
      update.update_time = Number(update_time)
    }

    return await this.reference()
      .where({ id })
      .update({ ...update })
      .then(() => {
        return
      })
      .catch(error => {
        throw new AppError('Database Error', 406, error.message, true)
      })
  }

  public delete = async ({ id }: deleteCPFLSearchInterface) => {
    return await this.reference()
      .where({
        id
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