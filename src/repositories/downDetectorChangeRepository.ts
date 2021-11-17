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
  dates?: Array<string>
}

export default class DownDetectorChangeRepository {
  private reference = () => connection<downDetectorChangeInterface>(DOWN_DETECTOR_CHANGE_TABLE_NAME)

  private indexRaw = ({
    identifiers,
    orderBy,
    limit,
    dates
  }: indexDownDetectorChangeIndexOptions) => {
    let sql = `select * from ${DOWN_DETECTOR_CHANGE_TABLE_NAME}`

    if (!!identifiers && !!identifiers.serviceURL) {
      sql = `${sql} where site_c = '${identifiers.serviceURL}'`
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
    dates
  }: indexDownDetectorChangeIndexOptions) => {
    return connection.raw(this.indexRaw({ identifiers, orderBy, limit, dates}))
      .then(downDetectorChanges => downDetectorChanges[0])
      .catch(error => {
        throw new AppError('Database Error', 406, error.message, true)
      })
  }
}