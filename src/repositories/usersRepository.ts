import { Knex } from 'knex'
import bcrypt from 'bcryptjs'

import { AppError } from './../utils/handleError'
const connection: Knex<any, unknown[]> = require('./../database')
const { USERS_TABLE_NAME } = require('./../database/types')

export interface UserInterface {
  id: number,

  login: string,
  password: string
}

export interface createUserInterface {
  login: string,
  password: string
}

export interface getUserInterface {
  id?: number,
  login?: string,
}

export interface indexUserInterface {}

export interface updateUserInterface {
  identifiers: {
    id?: number,
    login?: string
  },
  payload: {
    password: string
  }
}

export interface removeUserInterface {
  id: number
}

export default class UsersRepository {
  private reference = () => connection<UserInterface>(USERS_TABLE_NAME)

  public create = async ({
    login,
    password
  }: createUserInterface) => {
    const salt = await bcrypt.genSalt()
    password = await bcrypt.hash(password, salt)

    return this.reference()
      .insert({
        login,
        password
      })
      .then(() => {
        return
      })
      .catch(error => {
        throw new AppError('Database Error', 406, error.message, true)
      })
  }

  public get = async ({
    id,
    login
  }: getUserInterface) => {
    let query = this.reference()

    if (!!id) {
      query = query.where('id', '=', id)
    }

    if (!!login) {
      query = query.where('login', '=', login)
    }

    return query
      .first()
      .select('*')
      .then(user => user)
      .catch(error => {
        throw new AppError('Database Error', 406, error.message, true)
      })
  }

  public index = async ({}: indexUserInterface) => {
    let query = this.reference()

    return query
      .select('id', 'login')
      .then(downDetectorHists => downDetectorHists)
      .catch(error => {
        throw new AppError('Database Error', 406, error.message, true)
      })
  }

  public update = async ({
    identifiers,
    payload
  }: updateUserInterface) => {
    let query = this.reference()

    if (!!identifiers.id) {
      query = query.where('id', '=', identifiers.id)
    }

    if (!!identifiers.login) {
      query = query.where('login', '=', identifiers.login)
    }

    const salt = await bcrypt.genSalt()
    const password = await bcrypt.hash(payload.password, salt)

    return query
      .update({
        password
      })
      .then(() => {
        return
      })
      .catch(error => {
        throw new AppError('Database Error', 406, error.message, true)
      })
  }

  public delete = async ({
    id
  }: removeUserInterface) => {
    return this.reference()
      .where('id', '=', id)
      .first()
      .delete()
      .then(() => {
        return
      })
      .catch(error => {
        throw new AppError('Database Error', 406, error.message, true)
      })
  }
}