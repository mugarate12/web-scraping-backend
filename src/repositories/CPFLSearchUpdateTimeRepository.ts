import { Knex } from 'knex'
import moment from 'moment'

import { AppError } from './../utils/handleError'
const connection: Knex<any, unknown[]> = require('./../database')
const { 
  CPFL_SEARCH_UPDATE_TIME
} = require('./../database/types')

interface CPFLSearchUpdateTimeInterface {
  id: number,
  last_execution: string,
  cpfl_search_FK: number
}

interface createCPFLSearchUpdateTimeInterface {
  cpfl_search_FK: number
}

interface updateCPFLSearchUpdateTimeInterface {
  cpfl_search_FK: number,
  last_execution: string
}

interface deleteCPFLSearchUpdateTimeInterface {
  cpfl_search_FK: number
}

export default class CPFLSearchUpdateTimeRepository {
  private reference = () => connection<CPFLSearchUpdateTimeInterface>(CPFL_SEARCH_UPDATE_TIME)

  public create = async ({ cpfl_search_FK }: createCPFLSearchUpdateTimeInterface) => {
    return this.reference()
      .insert({ cpfl_search_FK })
      .then(() => {
        return
      })
      .catch(error => {
        throw new AppError('Database Error', 406, error.message, true)
      })
  }

  public index = async () => {
    return this.reference()
      .select("*")
      .then(searchsUpdateTime => searchsUpdateTime)
      .catch(error => {
        throw new AppError('Database Error', 406, error.message, true)
      })
  }

  public update = async ({ cpfl_search_FK, last_execution }: updateCPFLSearchUpdateTimeInterface) => {
    return this.reference()
      .where({ cpfl_search_FK })
      .update({ last_execution })
      .then(() => {
        return
      })
      .catch(error => {
        throw new AppError('Database Error', 406, error.message, true)
      })
  }

  public delete = async ({ cpfl_search_FK }: deleteCPFLSearchUpdateTimeInterface) => {
    return this.reference()
      .where({ cpfl_search_FK })
      .delete()
      .then(() => {
        return
      })
      .catch(error => {
        throw new AppError('Database Error', 406, error.message, true)
      })
  }
}