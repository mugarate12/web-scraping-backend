import { Knex } from 'knex'
import moment from 'moment'
import dotenv from 'dotenv'

import { AppError } from './../utils/handleError'
const connection: Knex<any, unknown[]> = require('./../database')
const { 
  CPFL_DATA
} = require('./../database/types')

dotenv.config()

export interface CPFLDataInterface {
  id: number,

  state: string,
  city: string,
  district: string,
  street: string,

  status: number,
  reason: string,

  date: string,

  initial_hour: string,
  final_hour: string,
  
  duration: number,
  final_seconds: number,
  final_maintenance: number
}

interface createCPFLDataInterface {
  state: string,
  city: string,
  district: string,
  street: string,

  status: number,
  reason: string,

  date: string,
  
  initial_hour: string,
  final_hour: string,
  
  duration: number,
  final_seconds: number,
  final_maintenance: number
}

interface indexCPFLDataInterface {
  state?: string,
  city?: string,
  district?: string,
  street?: string,

  states?: Array<string>,
  cities?: Array<string>,

  date?: string,

  status?: number
}

interface indexPerDateInterface {
  state?: string,
  city?: string,
  district?: string,
  street?: string,

  states?: Array<string>,
  cities?: Array<string>,

  status?: number,

  date: string
}

interface indexPerDateWithLimitInterface {
  lowerLimit: string,
  higherLimit: string,

  states?: Array<string>,
  cities?: Array<string>,

  status?: number
}

interface getCPFLDataInterface {
  state: string,
  city: string,
  district: string,
  street: string,

  date: string,

  status?: number
}

interface updateCPFLDataInterface {
  identifiers: {
    id: number
  },
  payload: {
    final_seconds?: number,
    final_maintenance?: number,
    status?: number
  }
}

interface deleteCPFLDataInterface {
  state?: string,
  city?: string,

  status?: number,

  date?: string
}

export default class CPFLDataRepository {
  private reference = () => connection<CPFLDataInterface>(CPFL_DATA)

  public create = async ({ state, city, district, street, status, reason, date, initial_hour, final_hour, duration, final_seconds, final_maintenance }: createCPFLDataInterface) => {
    return await this.reference()
      .insert({ state, city, district, street, status, reason, date, initial_hour, final_hour, duration, final_seconds, final_maintenance })
      .then(() => {
        return
      })
      .catch(error => {
        throw new AppError('Database Error', 406, error.message, true)
      })
  }

  public index = async ({ state, city, street, district, date, status, states, cities }: indexCPFLDataInterface) => {
    let query = this.reference()

    // if (!!state) query = query.where('state', '=', state)
    // if (!!city) query = query.where('city', '=', city)

    if (!!state && !states) {
      query = query.where('state', '=', state)
    }

    if ((!state && !!states && states.length > 0) || (!!state && !!states && states.length > 0)) {
      query = query.where(function() {
        this.where('state', '=', states[0])

        states.slice(1, states.length).forEach((stateValue) => {
          this.orWhere('state', '=', stateValue)
        })
      })
    }

    if (!!city && !cities) {
      if (!!city) query = query.where('city', '=', city)
    }

    if ((!city && !!cities && cities.length > 0) || (!!city && !!cities && cities.length > 0)) {
      query = query.where(function() {
        this.where('city', '=', cities[0])
  
        cities.slice(1, cities.length).forEach((cityValue) => {
          this.orWhere('city', '=', cityValue)
        })
      })
    }

    if (!!district) query = query.where('district', '=', district)
    if (!!street) query = query.where('street', '=', street)
    if (!!date) query = query.where('date', '=', date)
    if (!!status) query = query.where('status', '=', status)

    return query
      .select('*')
      .then(cpflDatas => cpflDatas)
      .catch(error => {
        throw new AppError('Database Error', 406, error.message, true)
      })
  }

  public indexPerDateWithLimit = async ({ lowerLimit, higherLimit, status, states, cities }: indexPerDateWithLimitInterface) => {
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

  public indexPerDate = async ({ status, state, district, street, date, states, cities }: indexPerDateInterface) => {
    let query = this.reference()

    const convertHour = Number(process.env.CONVERT_TO_TIMEZONE)
    const firstDayOfNextYear = moment()
      .subtract(convertHour, 'hours')
      .add(1, 'years')
      .dayOfYear(1)
      .format('DD/MM/YYYY')

    if (Number(date.split('/')[2]) < Number(firstDayOfNextYear.split('/')[2])) {
      query = query.where(function() {
        this
          .where('date', '>=', date)
          .orWhere('date', '>=', firstDayOfNextYear)
      })
    } else {
      query = query
        .where('date', '>=', date)
    }
    
    if (!!state && !states) {
      query = query.where('state', '=', state)
    }

    if ((!state && !!states && states.length > 0) || (!!state && !!states && states.length > 0)) {
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
    
    if (!!district) {
      query = query.where('district', '=', district)
    }
    
    if (!!street) {
      query = query.where('street', '=', street)
    }

    if (!!status) {
      query = query.where('status', '=', status)
    }

    console.log(query.toSQL().toNative())

    return query
      .then(data => data)
      .catch(error => {
        throw new AppError('Database Error', 406, error.message, true)
      })
  }

  public get = async ({ state, city, district, street, date, status }: getCPFLDataInterface) => {
    let query = this.reference()
      .where({ state, city, district, street, date })

    if (!!status) {
      query = query.where('status', '=', status)
    }

    return await query
      .select('*')
      .first()
      .then(cpflData => cpflData)
      .catch(error => {
        throw new AppError('Database Error', 406, error.message, true)
      })
  }

  public update = async ({ identifiers, payload }: updateCPFLDataInterface) => {
    let query = this.reference()
    let updatePayload: updateCPFLDataInterface['payload'] = {}

    if (!!identifiers.id) {
      query = query.where('id', '=', identifiers.id)
    }

    if (!!payload) {
      if (!!payload.final_seconds || Number(payload.final_seconds) === 0) {
        updatePayload.final_seconds = payload.final_seconds
      }

      if (!!payload.final_maintenance || Number(payload.final_maintenance) === 0) {
        updatePayload.final_maintenance = payload.final_maintenance
      }

      if (!!payload.status) {
        updatePayload.status = payload.status
      }
    }

    return await query
      .update(updatePayload)
      .then(() => {
        return 
      })
      .catch(error => {
        throw new AppError('Database Error', 406, error.message, true)
      })
  }

  public delete = async ({ city, state, status, date }: deleteCPFLDataInterface) => {
    let query = this.reference()

    if (!!city) {
      query = query.where('city', '=', city)
    }

    if (!!state) {
      query = query.where('state', '=', state)
    }

    if (!!status) {
      query = query.where('status', '=', status)
    }

    if (!!date) {
      query = query.where('date', '=', date)
    }

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