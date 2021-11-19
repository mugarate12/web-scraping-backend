import { Knex } from 'knex'

import { AppError } from './../utils/handleError'
const connection: Knex<any, unknown[]> = require('./../database')
const { DOWN_DETECTOR_ROUTINE_EXECUTION } = require('./../database/types')

export interface downDetectorRoutineExecution {
  id: number,

  time: number,
  execution: number
}

export default class DownDetectorRoutineExecutionRepository {
  private reference = () => connection<downDetectorRoutineExecution>(DOWN_DETECTOR_ROUTINE_EXECUTION)

  public get = async (routine: number) => {
    return this.reference()
      .where({
        time: routine
      })
      .first()
      .select('*')
      .then(routine => routine)
      .catch(error => {
        throw new AppError('Database Error', 406, error.message, true)
      })
  }

  public update = async (routine: number, execution: number) => {
    return this.reference()
      .where({
        time: routine
      })
      .first()
      .update({
        execution
      })
      .then(() => {
        return
      })
      .catch(error => {
        throw new AppError('Database Error', 406, error.message, true)
      })
  }
}