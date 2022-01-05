import { Knex } from 'knex'
import bcrypt from 'bcryptjs'

import { AppError } from './../utils/handleError'
const connection: Knex<any, unknown[]> = require('./../database')
const { PERMISSIONS_TABLE_NAME } = require('./../database/types')

export interface permissionsInterface {
  id: number,
  identifier: string
}

interface getPermissionInterface {
  id?: number,
  identifier?: string
}

export default class PermissionsRepository {
  private reference = () => connection<permissionsInterface>(PERMISSIONS_TABLE_NAME)

  public get = async ({
    id,
    identifier
  }: getPermissionInterface) => {
    let query = this.reference()

    if (!!id) {
      query = query.where('id', '=', id)
    }

    if (!!identifier) {
      query = query.where('identifier', '=', identifier)
    }

    return query
      .first()
      .select('*')
      .then(permission => permission)
      .catch(error => {
        throw new AppError('Database Error', 406, error.message, true)
      })
  }

  public index = async () => {
    let query = this.reference()

    return query
      .select('*')
      .then(permissions => permissions)
      .catch(error => {
        throw new AppError('Database Error', 406, error.message, true)
      })
  }
}