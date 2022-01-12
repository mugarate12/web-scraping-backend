import { Knex } from 'knex'
import moment from 'moment'

import { AppError } from './../utils/handleError'
const connection: Knex<any, unknown[]> = require('./../database')
const { 
  EQUATORIAL_DATA
} = require('./../database/types')

interface EquatorialDataInterface {
  id: number,

  state: string,
  city: string,
  district: string,
  street: string,

  status: number,

  date: string,
  initial_hour: string,
  final_hour: string,

  duration: number,
  final_seconds: number,
  final_maintenance: number,

  reason: string,
  affected_clients: number
}

interface createEquatorialData {
  state: string,
  city: string,
  district: string,
  street: string,

  date: string,
  initial_hour: string,
  final_hour: string,

  status: number,

  duration: number,
  final_seconds: number,
  final_maintenance: number,

  reason: string,
  affected_clients: number
}

interface getEquatorialDataInterface {
  date?: string,

  state?: string,
  city?: string,
  district?: string,
  street?: string,

  status?: number
}

interface indexEquatorialDataInterface {
  date?: string,

  state?: string,
  city?: string,
  district?: string,
  street?: string,

  status?: number
}

interface updateEquatorialDataInterface {
  identifiers: {
    id?: number,

    date?: string,

    state?: string,
    city?: string,
    district?: string,
    street?: string,

    status?: number
  },
  payload: {
    status?: number,

    duration?: number,
    final_seconds?: number,
    final_maintenance?: number,
  }
}

interface deleteEquatorialDataInterface {
  status?: number,
  id?: number
}

export default class EquatorialDataRepository {
  private reference = () => connection<EquatorialDataInterface>(EQUATORIAL_DATA)

  public create = async (payload: createEquatorialData) => {
    return this.reference()
      .insert({ ...payload })
      .then(() => {})
      .catch(error => {
        throw new AppError('Database Error', 406, error.message, true)
      })
  }

  public get = async ({ date, state, city, district, street, status }: getEquatorialDataInterface) => {
    let query = this.reference()

    if (!!date) query = query.where('date', '=', date)
    if (!!state) query = query.where('state', '=', state)
    if (!!city) query = query.where('city', '=', city)
    if (!!district) query = query.where('district', '=', district)
    if (!!street) query = query.where('street', '=', street)
    if (!!status) query = query.where('status', '=', status)

    return query
      .select('*')
      .first()
      .then(equatorialData => equatorialData)
      .catch(error => {
        throw new AppError('Database Error', 406, error.message, true)
      })
  }
  
  public index = async ({ date, state, city, district, street, status }: indexEquatorialDataInterface) => {
    let query = this.reference()

    if (!!date) query = query.where('date', '=', date)
    if (!!state) query = query.where('state', '=', state)
    if (!!city) query = query.where('city', '=', city)
    if (!!district) query = query.where('district', '=', district)
    if (!!street) query = query.where('street', '=', street)
    if (!!status) query = query.where('status', '=', status)


    return query
      .select('*')
      .then(equatorialDataArray => equatorialDataArray)
      .catch(error => {
        throw new AppError('Database Error', 406, error.message, true)
      })
  }

  public update = async ({ identifiers, payload }: updateEquatorialDataInterface) => {
    let updatePayload: {
      status?: number,

      duration?: number,
      final_seconds?: number,
      final_maintenance?: number,
    } = {}
    let query = this.reference()

    if (!!identifiers) {
      if (!!identifiers.id) query = query.where('id', '=', identifiers.id)
      
      if (!!identifiers.state) query = query.where('state', '=', identifiers.state)
      if (!!identifiers.city) query = query.where('city', '=', identifiers.city)
      if (!!identifiers.district) query = query.where('district', '=', identifiers.district)
      if (!!identifiers.street) query = query.where('street', '=', identifiers.street)

      if (!!identifiers.status) query = query.where('status', '=', identifiers.status)
    }

    if (!!payload) {
      if (!!payload.status) updatePayload.status = payload.status
     
      if (!!payload.duration) updatePayload.duration = payload.duration
      if (!!payload.final_seconds) updatePayload.final_seconds = payload.final_seconds
      if (!!payload.final_maintenance) updatePayload.final_maintenance = payload.final_maintenance
    }

    return query
      .update({ ...updatePayload })
      .then(() => {})
      .catch(error => {
        throw new AppError('Database Error', 406, error.message, true)
      })
  }

  public delete = async ({ id, status }: deleteEquatorialDataInterface) => {
    let query = this.reference()

    if (!!id) query.where('id', '=', id)
    if (!!status) query.where('status', '=', status)

    return query
      .delete()
      .then(() => {})
      .catch(error => {
        throw new AppError('Database Error', 406, error.message, true)
      })
  }
}