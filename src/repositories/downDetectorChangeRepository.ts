import { Knex } from 'knex'

import { AppError } from './../utils/handleError'
const connection: Knex<any, unknown[]> = require('./../database')
const { DOWN_DETECTOR_CHANGE_TABLE_NAME } = require('./../database/types')

export interface downDetectorChangeInterface {
  id: number,

  site_c: string,
  hist_date: string,
  status_atual: number,
  status_anterior: number,
  status_change: number
}

export interface createDownDetectorChangeInterface {
  site_c: string,
  hist_date: string,
  status_atual: number,
  status_anterior: number,
  status_change: number
}

export interface indexDownDetectorChangeIndexOptions {
  identifiers?: {
    serviceURL?: string
  },
  orderBy?: {
    property: string,
    orientation: 'desc' | 'asc'
  },
  limit?: number,
  initialDate?: string,
  finalDate?: string
}

export default class DownDetectorChangeRepository {
  private reference = () => connection<downDetectorChangeInterface>(DOWN_DETECTOR_CHANGE_TABLE_NAME)

  public create = async ({
    site_c,
    hist_date,
    status_atual,
    status_anterior,
    status_change
  }: createDownDetectorChangeInterface) => {
    return this.reference()
      .insert({
        site_c,
        hist_date,
        status_atual,
        status_anterior,
        status_change
      })
      .then(() => {
        return
      })
      .catch(error => {
        throw new AppError('Database Error', 406, error.message, true)
      })
  }

  public index = async ({
    identifiers,
    orderBy,
    limit,
    initialDate,
    finalDate
  }: indexDownDetectorChangeIndexOptions) => {
    let query = this.reference()

    if (!!identifiers) {
      if (!!identifiers.serviceURL) {
        query = query.where('site_c', '=', identifiers.serviceURL)
      }
    }

    if (!!orderBy) {
      query =  query.orderBy(orderBy.property, orderBy.orientation)
    }

    if (!!limit) {
      query = query.limit(limit)
    }

    if (!!initialDate) {
      query = query.where('hist_date', 'like', `%${initialDate}%`)
    }
    
    if (!!finalDate) {
      query = query.where('hist_date', 'like', `%${finalDate}%`)
    }

    return query
      .select('*')
      .then(downDetectorHists => downDetectorHists)
      .catch(error => {
        throw new AppError('Database Error', 406, error.message, true)
      })
  }
}