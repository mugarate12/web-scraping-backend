import { Knex } from 'knex'

import { AppError } from './../utils/handleError'
const connection: Knex<any, unknown[]> = require('./../database')
const { DOWN_DETECTOR_CHANGE_TABLE_NAME } = require('./../database/types')

export interface downDetectorChangeInterface {
  id: number,

  site_c: string,
  hist_date: string,
  dateUnixTime: string,
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

interface indexWithDateInterface {
  identifiers?: {
    serviceURL?: string
  },
  orderBy?: {
    property: string,
    orientation: 'desc' | 'asc'
  },
  limit?: number,
  date: string
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

  private indexWithDate = async ({
    identifiers,
    orderBy,
    limit,
    date
  }: indexWithDateInterface) => {
    let query = this.reference()

    query = query
      .where('hist_date', 'like', `%${date}%`)

    if (!!identifiers && !!identifiers.serviceURL) {
      query = query
        .where('site_c', '=', identifiers.serviceURL)
    }

    if (!!orderBy) {
      query = query
        .orderBy(orderBy.property, orderBy.orientation)
    }

    if (!!limit) {
      query = query
        .limit(limit)
    }

    return await query
      .select('*')
      .then(changes => changes)
      .catch(error => {
        throw new AppError('Database Error', 406, error.message, true)
      })
  }

  public create = async ({
    site_c,
    hist_date,
    status_atual,
    status_anterior,
    status_change
  }: createDownDetectorChangeInterface) => {
    const unixDate = Math.round((new Date(hist_date)).getTime() / 1000)

    return this.reference()
      .insert({
        site_c,
        hist_date,
        dateUnixTime: String(unixDate),
        status_atual,
        status_anterior,
        status_change,
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
    let changes: downDetectorChangeInterface[] = []
    
    if (!!dates && dates.length > 0) {
      for (let index = 0; index < dates.length; index++) {
        const date = dates[index]
        
        const change = await this.indexWithDate({
          identifiers,
          orderBy,
          limit,
          date
        })

        console.log(change);

        changes = [ ...change ]
      }

      return changes
    } else {
      let query = this.reference()
  
      if (!!identifiers && !!identifiers.serviceURL) {
        query = query
          .where('site_c', '=', identifiers.serviceURL)
      }
  
      if (!!orderBy) {
        query = query
          .orderBy(orderBy.property, orderBy.orientation)
      }
  
      if (!!limit) {
        query = query
          .limit(limit)
      }

      return query
        .select('*')
        .then(changes => changes)
        .catch(error => {
          throw new AppError('Database Error', 406, error.message, true)
        })
    }
  }
}