import { Knex } from 'knex'
import bcrypt from 'bcryptjs'

import { AppError } from './../utils/handleError'
const connection: Knex<any, unknown[]> = require('./../database')
const { OCR_SERVICES } = require('./../database/types')

interface OCRServiceInterface {
  id: number,
  pix_name: string,
  state: string,
  city: string,

  able: number
}

interface createServiceInterface {
  pix_name: string,
  state: string,
  city: string,
  able: number
}

interface getServiceInterface {
  pix_name: string,
  state: string,
  city: string
}

interface indexServiceInterface {
  state?: string,
  city?: string,

  able?: number
}

interface updateServiceInterface {
  identifiers: {
    pix_name: string,
    state: string,
    city: string,
  },
  payload: {
    able: number
  }
}

interface deleteServiceInterface {
  pix_name: string,
  state: string,
  city: string
}

export default class OCRServicesRepository {
  private reference = () => connection<OCRServiceInterface>(OCR_SERVICES)

  public create = async ({ pix_name, state, city, able }: createServiceInterface) => {
    return this.reference()
      .insert({ pix_name, state, city, able })
      .then(() => {})
      .catch(error => {
        throw new AppError('Database Error', 406, error.message, true)
      })
  }

  public get = async ({ pix_name, state, city }: getServiceInterface) => {
    return this.reference()
      .where({ pix_name, state, city })
      .select('*')
      .first()
      .then(ocrService => ocrService)
      .catch(error => {
        throw new AppError('Database Error', 406, error.message, true)
      })
  }

  public index = async ({ state, city, able }: indexServiceInterface) => {
    let query = this.reference()

    if (!!state) query.where('state', '=', state)
    if (!!city) query.where('city', '=', city)
    if (!!able) query.where('able', '=', able)

    return query
      .select('*')
      .then(ocrServices => ocrServices)
      .catch(error => {
        throw new AppError('Database Error', 406, error.message, true)
      })
  }

  public update = async ({ identifiers, payload }: updateServiceInterface) => {
    return this.reference()
      .where({
        pix_name: identifiers.pix_name,
        state: identifiers.state,
        city: identifiers.city
      })
      .update({
        able: payload.able
      })
      .then(() => {
        return
      })
      .catch(error => {
        throw new AppError('Database Error', 406, error.message, true)
      })
  }

  public delete = async ({ pix_name, state, city }: deleteServiceInterface) => {
    return this.reference()
      .where({ pix_name, state, city })
      .delete()
      .then(() => {
        return
      })
      .catch(error => {
        throw new AppError('Database Error', 406, error.message, true)
      })
  }
}