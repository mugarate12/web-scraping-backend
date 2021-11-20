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
  dates: Array<string>
}

export default class DownDetectorHistRepository {
  private reference = () => connection<downDetectorHistInterface>(DOWN_DETECTOR_HIST_TABLE_NAME)

  private IndexRaw = ({
    serviceURL,
    orderBy,
    limit,
    dates
  }: indexDownDetectorHistIndexOptions) => {
    let sql = `select * from ${DOWN_DETECTOR_HIST_TABLE_NAME}`
    
    if (!!serviceURL) {
      sql = `${sql} where site_d = '${serviceURL}'`
    }

    if (!!dates && dates.length > 0) {
      sql = `${sql} and (`

      dates.forEach((date, index) => {
        if (index < dates.length - 1) {
          sql = `${sql}hist_date like '%${date}%' or `
        } else {
          sql = `${sql}hist_date like '%${date}%'`
        }
      })

      sql = `${sql})`
    }

    if (!!orderBy && !!orderBy.orientation && !!orderBy.property) {
      sql = `${sql} order by ${orderBy.property} ${orderBy.orientation}`
    }

    if (!!limit) {
      sql = `${sql} limit ${limit}`
    }

    return sql
  }

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
        console.log(error);
      })
  }

  public createInMassive = async (insertions: Array<createDownDetectorHistInterface>) => {
    for (let index = 0; index < insertions.length; index++) {
      const insertion = insertions[index];
      
      await this.reference()
        .insert(insertion)
          .then(() => {
            return
          })
          .catch(error => {
            // console.log(insertions[0].site_d)
            // console.log(error.message)
            // console.log('\n')
          })
    }
  }

  // refatorar
  public index = async ({
    serviceURL,
    orderBy,
    limit,
    dates
  }: indexDownDetectorHistIndexOptions) => {
    return connection.raw(this.IndexRaw({ serviceURL, dates, orderBy, limit }))
      .then(downDetectorHists => downDetectorHists[0])
      .catch(error => {
        throw new AppError('Database Error', 406, error.message, true)
      })
  }

  public get = async (date: string) => {
    return this.reference()
      .where({ hist_date: date })
      .first()
      .then(history => history)
      .catch(error => {
        throw new AppError('Database Error', 406, error.message, true)
      })
  }

  public indexWithOneDate = async ({
    serviceURL,
    date
  }: { serviceURL: string, date: string }) => {
    return this.reference()
      .where({
        site_d: serviceURL
      })
      .where('hist_date', 'like', `%${date}%`)
      .select('*')
      .then(histories => histories)
      .catch(error => {
        throw new AppError('Database Error', 406, error.message, true)
      })
  }
}