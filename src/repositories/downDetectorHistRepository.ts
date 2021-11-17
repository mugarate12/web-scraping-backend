import { Knex } from 'knex'

import { AppError } from './../utils/handleError'
const connection: Knex<any, unknown[]> = require('./../database')
const { DOWN_DETECTOR_HIST_TABLE_NAME } = require('./../database/types')

export interface downDetectorHistInterface {
  id: number,

  site_d: string,
  hist_date: string,
  baseline: number,
  notification_count: number
}

export interface createDownDetectorHistInterface {
  site_d: string,
  hist_date: string,
  baseline: number,
  notification_count: number
}

export interface indexDownDetectorHistIndexOptions {
  serviceURL?: string,
  orderBy?: {
    property: string,
    orientation: 'desc' | 'asc'
  },
  limit?: number,
  dates?: Array<string>
}

export default class DownDetectorHistRepository {
  private reference = () => connection<downDetectorHistInterface>(DOWN_DETECTOR_HIST_TABLE_NAME)

  public create = async ({
    site_d,
    hist_date,
    baseline,
    notification_count
  }: createDownDetectorHistInterface) => {
    return this.reference()
      .insert({
        site_d,
        hist_date,
        baseline,
        notification_count
      })
      .then(() => {
        return
      })
      .catch(error => {
        throw new AppError('Database Error', 406, error.message, true)
      })
  }

  public index = async ({
    serviceURL,
    orderBy,
    limit,
    dates
  }: indexDownDetectorHistIndexOptions) => {
    let query = this.reference()

    if (!!serviceURL) {
      query =  query.where('site_d', '=', serviceURL)
    }

    if (!!orderBy) {
      query =  query.orderBy(orderBy.property, orderBy.orientation)
    }

    if (!!limit) {
      query = query.limit(limit)
    }

    if (!!dates && dates.length === 1) {
      query = query.where('hist_date', 'like', `%${dates[0]}%`)
    }

    if (!!dates && dates.length > 1) {
      query = query.where('hist_date', 'like', `%${dates[0]}%`)
      dates.slice(1, dates.length).forEach(date => {
        query = query.orWhere('hist_date', 'like', `%${date}%`)
      })
    }

    // if (!!initialDate) {
    //   query = query.where('hist_date', 'like', `%${initialDate}%`)
    // }
    
    // if (!!finalDate) {
    //   query = query.where('hist_date', 'like', `%${finalDate}%`)
    // }

    return query
      .select('*')
      .then(downDetectorHists => downDetectorHists)
      .catch(error => {
        throw new AppError('Database Error', 406, error.message, true)
      })
  }
}