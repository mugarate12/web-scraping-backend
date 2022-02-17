import { Knex } from 'knex'
import moment from 'moment'

import { AppError } from './../utils/handleError'
const connection: Knex<any, unknown[]> = require('./../database')
const { 
  NFE_FAZENDA_PERMISSIONS_TABLE_NAME
} = require('./../database/types')

interface nfseFazendaPermissionsInterface {
  id: number, 

  nfe_fazenda_FK: number,
  client_FK: number
}

interface createNfseFazendaPermissionInterface {
  nfe_fazenda_FK: number,
  client_FK: number
}

interface indexNfseFazendaPermissionsInterface {
  client_FK: number
}

interface deleteNfseFazendaPermissionInterface {
  nfe_fazenda_FK?: number,
  client_FK: number
}

export default class NFEFazendaPermissionsRepository {
  private reference = () => connection<nfseFazendaPermissionsInterface>(NFE_FAZENDA_PERMISSIONS_TABLE_NAME)

  public create = async ({ nfe_fazenda_FK, client_FK }: createNfseFazendaPermissionInterface) => {
    return this.reference()
      .insert({ nfe_fazenda_FK, client_FK })
      .then(() => {
        return
      })
      .catch(error => {
        throw new AppError('Database Error', 406, error.message, true)
      })
  }

  public index = async ({ client_FK }: indexNfseFazendaPermissionsInterface) => {
    return this.reference()
      .where('client_FK', '=', client_FK)
      .then(permissions => permissions)
      .catch(error => {
        throw new AppError('Database Error', 406, error.message, true)
      })
  }

  public delete = async ({ nfe_fazenda_FK, client_FK }: deleteNfseFazendaPermissionInterface) => {
    let query = this.reference()

    if (!!nfe_fazenda_FK) query.where('nfe_fazenda_FK', '=', nfe_fazenda_FK)
    query.where('client_FK', '=', client_FK)

    return query
      .delete()
      .then(() => {
        return
      })
      .catch(error => {
        throw new AppError('Database Error', 406, error.message, true)
      })
  }
}