import { Knex } from 'knex'
import bcrypt from 'bcryptjs'

import { AppError } from './../utils/handleError'
const connection: Knex<any, unknown[]> = require('./../database')
const { HOSTS_PERFIS_TABLE_NAME } = require('./../database/types')

interface hostsPerfilsInterface {
  id: number,
  name: string,

  user: string,
  password: string,
  url: string,
  worksheet_link: string
}

interface createHostPerfilInterface {
  name: string,

  user: string,
  password: string,
  url: string,
  worksheet_link: string
}

interface updateHostPerfilInterface {
  identifiers: {
    id?: number,
    name?: string
  },
  payload: {
    name?: string,

    user?: string,
    password?: string,
    url?: string,
    worksheet_link?: string
  }
}

interface deleteHostPerfilInterface {
  id?: number,
  name?: string
}

export default class HostsPerfilsRepository {
  private reference = () => connection<hostsPerfilsInterface>(HOSTS_PERFIS_TABLE_NAME)

  public create = async ({ name, user, password, url, worksheet_link }: createHostPerfilInterface) => {
    return this.reference()
      .insert({
        name,

        user,
        password,
        url,
        worksheet_link
      })
      .then(() => {
        return
      })
      .catch(error => {
        throw new AppError('Database Error', 406, error.message, true)
      })
  }

  public index = async () => {
    return this.reference()
      .select('*')
      .then(hostsPerfis => hostsPerfis)
      .catch(error => {
        throw new AppError('Database Error', 406, error.message, true)
      })
  }

  public update = async ({ identifiers, payload }: updateHostPerfilInterface) => {
    let query = this.reference()

    if (!!identifiers.id) query = query.where('id', '=', identifiers.id)
    if (!!identifiers.name) query = query.where('name', '=', identifiers.name)

    return query
      .update({
        ...payload
      })
      .then(() => {
        return
      })
      .catch(error => {
        throw new AppError('Database Error', 406, error.message, true)
      })
  }

  public delete = async ({ id, name }: deleteHostPerfilInterface) => {
    let query = this.reference()

    if (!!id) query = query.where('id', '=', id)
    if (!!name) query = query.where('name', '=', name)
    
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