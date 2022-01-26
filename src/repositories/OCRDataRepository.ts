import { Knex } from 'knex'

import { AppError } from './../utils/handleError'
const connection: Knex<any, unknown[]> = require('./../database')
const { OCR_DATA_TABLE_NAME } = require('./../database/types')

export interface ocrDataInterface {
  id: number,

  state: string,
  city: string,

  service: string,
  up_value: string,
  up_percent: string,
  down_value: string,
  down_percent: string,

  last_update_page: string,
  last_update_routine: string
}

interface createOcrDataInterface {
  state: string,
  city: string,

  service: string,
  up_value: string,
  up_percent: string,
  down_value: string,
  down_percent: string,

  last_update_page: string,
  last_update_routine?: string
}

interface getOcrDataInterface {
  state: string,
  city: string,

  service: string
}

interface indexOcrDataInterface {
  services?: Array<string>,

  states?:  Array<string>,
  cities?:  Array<string>
}

interface updateOcrDataInterface {
  identifiers: {
    state: string,
    city: string,

    service: string
  },
  payload: {
    up_value: string,
    up_percent: string,
    down_value: string,
    down_percent: string,

    last_update_page: string,
    last_update_routine?: string
  }
}

// interface index 

export default class OCRDataRepository {
  private reference = () => connection<ocrDataInterface>(OCR_DATA_TABLE_NAME)

  public create = async ({ state, city, service, up_value, up_percent, down_value, down_percent, last_update_page, last_update_routine }: createOcrDataInterface) => {
    return this.reference()
      .insert({ state, city, service, up_value, up_percent, down_value, down_percent, last_update_page, last_update_routine })
      .then(() => {
        return
      })
      .catch(error => {
        throw new AppError('Database Error', 406, error.message, true)
      })
  }

  public get = async ({ state, city, service }: getOcrDataInterface) => {
    return this.reference()
      .where({ state, city, service })
      .select('*')
      .first()
      .then(ocrData => ocrData)
      .catch(error => {
        throw new AppError('Database Error', 406, error.message, true)
      })
  }

  public index = async ({ services, states, cities }: indexOcrDataInterface) => {
    let query = this.reference()
    
    if (!!states && states.length > 0) {
      query = query.where(function() {
        this.where('state', '=', states[0])

       states.slice(1, states.length).forEach(stateValue => {
         this.orWhere('state', '=', stateValue)
       }) 
      })
    }
    
    if (!!cities && cities.length > 0) {
      query = query.where(function() {
        this.where('city', '=', cities[0])

       cities.slice(1, cities.length).forEach(cityValue => {
         this.orWhere('city', '=', cityValue)
       }) 
      })
    }

    if (!!services && services.length > 0) {
      query = query.where(function() {
        this.where('service', '=', services[0])

        services.slice(1, services.length).forEach(service => {
          this.orWhere('service', '=', service)
        })
      })
    }
 
    return query
      .select('*')
      .then(ocrData => ocrData)
      .catch(error => {
        throw new AppError('Database Error', 406, error.message, true)
      })
  }

  public update = async ({ identifiers, payload }: updateOcrDataInterface) => {
    let query = this.reference()

    if (!!identifiers.service) query.where('service', '=', identifiers.service)
    if (!!identifiers.state) query.where('state', '=', identifiers.state)
    if (!!identifiers.city) query.where('city', '=', identifiers.city)

    let updatePayload: {
      up_value: string;
      up_percent: string;
      down_value: string;
      down_percent: string;
      last_update_page: string;
      last_update_routine?: string
    } = {
      up_value: payload.up_value,
      up_percent: payload.up_percent,
      down_value: payload.down_value,
      down_percent: payload.down_percent,
      last_update_page: payload.last_update_page
    }

    if (!!payload.last_update_routine) {
      updatePayload.last_update_routine = payload.last_update_routine
    }
    
    return query
      .update({
        ...updatePayload
      })
      .then(() => {
        return
      })
      .catch(error => {
        throw new AppError('Database Error', 406, error.message, true)
      })
  }
}