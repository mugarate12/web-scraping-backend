import { Knex } from 'knex'
import moment from 'moment'
import dotenv from 'dotenv'

import { AppError } from './../utils/handleError'
const connection: Knex<any, unknown[]> = require('./../database')
const { 
  ENERGISA_INFORMATIONS_TABLE_NAME
} = require('./../database/types')

dotenv.config()

interface EnergisaInformationInterface {
  id: number,

  state_name: string,
  state_cod: string,

  city_name: string,
  city_cod: string
}

interface createEnergisaInformationInterface {
  state_name: string,
  state_cod: string,

  city_name: string,
  city_cod: string
}

interface getEnergisaInformationsInterface {
  state_name: string,
  state_cod: string,

  city_name: string,
  city_cod: string
}

interface indexEnergisaInformationsInterface {
  state_name?: string,
  city_name?: string
}

interface updateEnergisaInformationsInterface {
  identifiers: {
    state_name: string,

    city_name: string,
  },
  payload: {
    state_cod?: string,
    city_cod?: string
  }
}

interface deleteEnergisaInformationInterface {
  id: number
}

export default class EnergisaInformationsRepository {
  private reference = () => connection<EnergisaInformationInterface>(ENERGISA_INFORMATIONS_TABLE_NAME)

  public create = async ({ state_name, state_cod, city_name, city_cod }: createEnergisaInformationInterface) => {
    return this.reference()
      .insert({
        state_name,
        state_cod,
        city_name,
        city_cod
      })
      .then(() => {
        return
      })
      .catch(error => {
        throw new AppError('Database Error', 406, error.message, true)
      })
  }

  public get = async ({ state_name, state_cod, city_name, city_cod }: getEnergisaInformationsInterface) => {
    return this.reference()
      .where({
        state_name,
        state_cod,
        city_name,
        city_cod
      })
      .select('*')
      .first()
      .then(energisaInformation => energisaInformation)
      .catch(error => {
        throw new AppError('Database Error', 406, error.message, true)
      })
  }

  public index = async ({ state_name, city_name }: indexEnergisaInformationsInterface) => {
    let query = this.reference()

    if (!!state_name) query = query.where('state_name', '=', state_name)
    if (!!city_name) query = query.where('city_name', '=', city_name)

    return query
      .select('*')
      .then(energisaInformations => energisaInformations)
      .catch(error => {
        throw new AppError('Database Error', 406, error.message, true)
      })
  }

  public update = async ({ identifiers, payload }: updateEnergisaInformationsInterface) => {
    let query = this.reference()

    query = query.where({ ...identifiers })

    let updatePayload: {
      state_cod?: string,
      city_cod?: string
    } = {}

    if (!!payload.state_cod) updatePayload.state_cod = payload.state_cod
    if (!!payload.city_cod) updatePayload.city_cod = payload.city_cod

    return query
      .update({ ...updatePayload })
      .then(() => {
        return
      })
      .catch(error => {
        throw new AppError('Database Error', 406, error.message, true)
      })
  }

  public delete = async ({ id }: deleteEnergisaInformationInterface) => {
    return this.reference()
      .where('id', '=', id)
      .delete()
      .then(() => {
        return
      })
      .catch(error => {
        throw new AppError('Database Error', 406, error.message, true)
      })
  }
}