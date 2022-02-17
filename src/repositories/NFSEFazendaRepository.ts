import { Knex } from 'knex'
import moment from 'moment'

import { AppError } from './../utils/handleError'
const connection: Knex<any, unknown[]> = require('./../database')
const { 
  NFE_FAZENDA_TABLE_NAME
} = require('./../database/types')

export interface NFSEFazendaInterface {
  id: number,

  update_time: string,

  autorizador: string,
  autorizacao: number,
  retorno_autorizacao: number,
  inutilizacao: number,
  consulta_protocolo: number,
  status_servico: number,
  tempo_medio: string,
  consulta_cadastro: number,
  recepcao_evento: number
}

interface createNfseFazendaInterface {
  autorizador: string,

  update_time: string,
  
  autorizacao: number,
  retorno_autorizacao: number,
  inutilizacao: number,
  consulta_protocolo: number,
  status_servico: number,
  tempo_medio: string,
  consulta_cadastro: number,
  recepcao_evento: number
}

interface getNfseFazendaInterface {
  autorizador: string,
}

interface updateNfseFazendaInterface {
  identifiers: {
    autorizador: string
  },
  payload: {
    autorizacao?: number,
    
    update_time?: string,

    retorno_autorizacao?: number,
    inutilizacao?: number,
    consulta_protocolo?: number,
    status_servico?: number,
    tempo_medio?: string,
    consulta_cadastro?: number,
    recepcao_evento?: number
  }
}

export default class NfseFazendaRepository {
  private reference = () => connection<NFSEFazendaInterface>(NFE_FAZENDA_TABLE_NAME)

  public create = async ({
    autorizador,

    update_time,

    autorizacao,
    retorno_autorizacao,
    inutilizacao,
    consulta_protocolo,
    status_servico,
    tempo_medio,
    consulta_cadastro,
    recepcao_evento
  }: createNfseFazendaInterface) => {
    return this.reference()
      .insert({
        autorizador,

        update_time,

        autorizacao,
        retorno_autorizacao,
        inutilizacao,
        consulta_protocolo,
        status_servico,
        tempo_medio,
        consulta_cadastro,
        recepcao_evento
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
      .then(nfseFazendaData => nfseFazendaData)
      .catch(error => {
        throw new AppError('Database Error', 406, error.message, true)
      })
  }

  public get = async ({ autorizador }: getNfseFazendaInterface) => {
    return this.reference()
      .where('autorizacao', '=', autorizador)
      .select('*')
      .first()
      .then(nfseFazendaData => nfseFazendaData)
      .catch(error => {
        throw new AppError('Database Error', 406, error.message, true)
      })
  }

  public update = async ({ identifiers, payload }: updateNfseFazendaInterface) => {
    return this.reference()
      .where({ ...identifiers })
      .update({ ...payload })
      .then(() => {
        return
      })
      .catch(error => {
        throw new AppError('Database Error', 406, error.message, true)
      })
  }
}