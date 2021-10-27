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
  serviceURL?: string
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
    serviceURL
  }: indexDownDetectorHistIndexOptions) => {
    let query = this.reference()

    if (!!serviceURL) {
      query =  query.where('site_d', '=', serviceURL)
    }

    return query
      .select('*')
      .then(downDetectorHists => downDetectorHists)
      .catch(error => {
        throw new AppError('Database Error', 406, error.message, true)
      })
  }
}