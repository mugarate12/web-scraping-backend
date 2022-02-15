import { Knex } from 'knex'

import { AppError } from './../utils/handleError'
const connection: Knex<any, unknown[]> = require('./../database')
const { ENERGISA_DATA_TABLE_NAME } = require('./../database/types')

export interface EnergisaDataInterface {
  id: number,

  state: string,
  city: string,
  street: string,

  status: number,

  date: string,

  initial_hour: string,
  final_hour: string,

  duration: number,
  final_seconds: number,
  final_maintenance: number
}

interface createEnergisaDataInterface {
  state: string,
  city: string,
  street: string,

  status: number,

  date: string,

  initial_hour: string,
  final_hour: string,

  duration: number,
  final_seconds: number,
  final_maintenance: number
}

interface getEnergisaDataInterface {
  state: string,
  city: string,
  street: string,

  status: number,

  date: string,

  initial_hour: string,
  final_hour: string,

  duration: number,
  final_seconds: number,
  final_maintenance: number
}

interface indexEnergisaDataInterface {
  states?: Array<string>,
  cities?: Array<string>,

  date?: string,

  status?: number
}

interface indexEnergisaPerDateWithLimitInterface {
  lowerLimit: string,
  higherLimit: string,

  states?: Array<string>,
  cities?: Array<string>,

  status?: number
}

interface updateEnergisaDataInterface {
  identifiers: {
    state: string,
    city: string,
    street: string,
  },
  payload: {
    status?: number,

    date?: string,
  
    initial_hour?: string,
    final_hour?: string,
  
    duration?: number,
    final_seconds?: number,
    final_maintenance?: number
  }
}

interface deleteEnergisaDataInterface {
  id?: number,

  state?: string,
  city?: string,

  status?: number
}

export default class EnergisaDataRepository {
  private reference = () => connection<EnergisaDataInterface>(ENERGISA_DATA_TABLE_NAME)

  public create = async ({
    state,
    city,
    street,

    status,

    date,

    initial_hour,
    final_hour,

    duration,
    final_seconds,
    final_maintenance
  }: createEnergisaDataInterface) => {
    return this.reference()
      .insert({
        state,
        city,
        street,
    
        status,
    
        date,
    
        initial_hour,
        final_hour,
    
        duration,
        final_seconds,
        final_maintenance
      })
      .then(() => {
        return
      })
      .catch(error => {
        throw new AppError('Database Error', 406, error.message, true)
      })
  }

  public get = async ({
    state,
    city,
    street,

    status,

    date,

    initial_hour,
    final_hour,

    duration,
    final_seconds,
    final_maintenance
  }: getEnergisaDataInterface) => {
    return this.reference()
      .where({
        state,
        city,
        street,

        status,

        date,

        initial_hour,
        final_hour,

        duration,
        final_seconds,
        final_maintenance
      })
      .first()
      .then(energisaData => energisaData)
      .catch(error => {
        throw new AppError('Database Error', 406, error.message, true)
      })
  }

  public index = async ({
    states,
    cities,

    status,

    date
  }: indexEnergisaDataInterface) => {
    let query = this.reference()

    if (!!states && states.length > 0) {
      query = query.where(function() {
        this.where('state', '=', states[0])
  
        states.slice(1, states.length).forEach((stateValue) => {
          this.orWhere('state', '=', stateValue)
        })
      })
    }
    
    if (!!cities && cities.length > 0) {
      query = query.where(function() {
        this.where('city', '=', cities[0])
  
        cities.slice(1, cities.length).forEach((cityValue) => {
          this.orWhere('city', '=', cityValue)
        })
      })
    }

    if (!!status) query.where('status', '=', status)
    if (!!date) query.where('date', '=', date)

    // console.log(query.toSQL().toNative())

    return query
      .select('*')
      .orderBy('date')
      .then(energisaData => energisaData)
      .catch(error => {
        throw new AppError('Database Error', 406, error.message, true)
      })
  }

  public indexPerDateWithLimit = async ({ lowerLimit, higherLimit, status, states, cities }: indexEnergisaPerDateWithLimitInterface) => {
    let query = this.reference()

    query = query.where(function() {
      this
        .where('date', '>=', lowerLimit)
        .andWhere('date', '<=', higherLimit)
    })

    if (!!states && states.length > 0) {
      query = query.where(function() {
        this.where('state', '=', states[0])

        states.slice(1, states.length).forEach((stateValue) => {
          this.orWhere('state', '=', stateValue)
        })
      })
    }

    if (!!cities && cities.length > 0) {
      query = query.where(function() {
        this.where('city', '=', cities[0])

        cities.slice(1, cities.length).forEach((cityValue) => {
          this.orWhere('city', '=', cityValue)
        })
      })
    }

    if (!!status) {
      query = query.where('status', '=', status)
    }

    return query
      .select('*')
      .then(cpflDatas => cpflDatas)
      .catch(error => {
        throw new AppError('Database Error', 406, error.message, true)
      })
  }

  public update = async ({ identifiers, payload }: updateEnergisaDataInterface) => {
    let updatePayload: {
      status?: number,

      date?: string,
    
      initial_hour?: string,
      final_hour?: string,
    
      duration?: number,
      final_seconds?: number,
      final_maintenance?: number
    } = {}

    if (!!payload.status) updatePayload.status = payload.status

    if (!!payload.date) updatePayload.date = payload.date

    if (!!payload.initial_hour) updatePayload.initial_hour = payload.initial_hour
    if (!!payload.final_hour) updatePayload.final_hour = payload.final_hour

    if (!!payload.duration) updatePayload.duration = payload.duration
    if (!!payload.final_seconds) updatePayload.final_seconds = payload.final_seconds
    if (!!payload.final_maintenance) updatePayload.final_maintenance = payload.final_maintenance
    
    return this.reference()
      .where(identifiers)
      .update({ ...updatePayload })
      .then(() => {
        return
      })
      .catch(error => {
        throw new AppError('Database Error', 406, error.message, true)
      })
  }

  public delete = async ({ id, state, city, status }: deleteEnergisaDataInterface) => {
    let query = this.reference()

    if (!!id) query.where('id', '=', id) 
    if (!!state) query.where('state', '=', state) 
    if (!!city) query.where('city', '=', city) 
    if (!!status) query.where('status', '=', status)

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
