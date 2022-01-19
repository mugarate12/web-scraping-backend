import { Knex } from 'knex'

import { AppError } from './../utils/handleError'
const connection: Knex<any, unknown[]> = require('./../database')
const { OCR_DATA_TABLE_NAME } = require('./../database/types')

interface ocrDataInterface {
  id: number,

  state: string,
  city: string,

  service: string,
  up_value: string,
  up_percent: string,
  down_value: string,
  down_percent: string
}

interface createOcrDataInterface {
  state: string,
  city: string,

  service: string,
  up_value: string,
  up_percent: string,
  down_value: string,
  down_percent: string
}

interface getOcrDataInterface {
  state: string,
  city: string,

  service: string
}

interface updateOcrDataInterface {
  identifiers: {
    state: string,
    city: string,

    service: string
  },
  payload: {
    up_value: string,
    up_percent: string,
    down_value: string,
    down_percent: string
  }
}

// interface index 

export default class OCRDataRepository {
  private reference = () => connection<ocrDataInterface>(OCR_DATA_TABLE_NAME)

  public create = async ({ state, city, service, up_value, up_percent, down_value, down_percent }: createOcrDataInterface) => {
    return this.reference()
      .insert({ state, city, service, up_value, up_percent, down_value, down_percent })
      .then(() => {
        return
      })
      .catch(error => {
        throw new AppError('Database Error', 406, error.message, true)
      })
  }

  public get = async ({ state, city, service }: getOcrDataInterface) => {
    return this.reference()
      .where({ state, city, service })
      .select('*')
      .first()
      .then(ocrData => ocrData)
      .catch(error => {
        throw new AppError('Database Error', 406, error.message, true)
      })
  }

  public index = async () => {
    return this.reference()
      .select('*')
      .then(ocrData => ocrData)
      .catch(error => {
        throw new AppError('Database Error', 406, error.message, true)
      })
  }

  public update = async ({ identifiers, payload }: updateOcrDataInterface) => {
    let query = this.reference()

    if (!!identifiers.service) query.where('service', '=', identifiers.service)
    if (!!identifiers.state) query.where('state', '=', identifiers.state)
    if (!!identifiers.city) query.where('city', '=', identifiers.city)
    
    return query
      .update({
        up_value: payload.up_value,
        up_percent: payload.up_percent,
        down_value: payload.down_value,
        down_percent: payload.down_percent
      })
      .then(() => {
        return
      })
      .catch(error => {
        throw new AppError('Database Error', 406, error.message, true)
      })
  }
}