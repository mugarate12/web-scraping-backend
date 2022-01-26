import { Knex } from 'knex'
import bcrypt from 'bcryptjs'

import { AppError } from './../utils/handleError'
const connection: Knex<any, unknown[]> = require('./../database')
const { OCR_PERMISSIONS } = require('./../database/types')

interface OCRPermissionsInterface {
  id: number,

  client_FK: number,

  state: string,
  city: string,
  pix_name: string
}

interface createOCRPermissionsInterface {
  client_FK: number,

  state: string,
  city: string,
  pix_name: string
}

interface indexOCRPermissionsInterface {
  client_FK?: number
}

interface deleteOCRPermissionsInterface {
  client_FK: number,
  state: string,
  city: string,
  pix_name: string
}

export default class OCRPermissionsRepository {
  private reference = () => connection<OCRPermissionsInterface>(OCR_PERMISSIONS)

  public create = async ({ client_FK, state, city, pix_name }: createOCRPermissionsInterface) => {
    return this.reference()
      .insert({ client_FK, state, city, pix_name })
      .then(() => {
        return
      })
      .catch(error => {
        throw new AppError('Database Error', 406, error.message, true)
      })
  }

  public index = async ({ client_FK }: indexOCRPermissionsInterface) => {
    let query = this.reference()

    if (!!client_FK) {
      query.where('client_FK', '=', client_FK)
    }

    return query
      .select('*')
      .then(ocrPermissions => ocrPermissions)
      .catch(error => {
        throw new AppError('Database Error', 406, error.message, true)
      })
  }

  public delete = async ({ client_FK, state, city, pix_name }: deleteOCRPermissionsInterface) => {
    return this.reference()
      .where({ client_FK, state, city, pix_name })
      .del()
      .then(() => {
        return
      })
      .catch(error => {
        throw new AppError('Database Error', 406, error.message, true)
      })
  }
}