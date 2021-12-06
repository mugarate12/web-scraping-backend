import { Server } from 'socket.io'
import puppeteer from 'puppeteer'
import moment from 'moment'
import Redis from 'promise-redis'
import dotenv from 'dotenv'

dotenv.config()
const redis = Redis()
const client = redis.createClient()

client.on("error", (error) => {
  console.error(error);
})

import {
  downDetectorController
} from './../controllers'

import {
  downDetectorChangeRepository,
  downDetectorHistRepository,
  downDetectorRoutineExecutionRepository,
  monitoringRepository,
  servicesRepository
} from './../repositories'

import { serviceInterface } from './../repositories/servicesRepository'

import { downDetectorChangeInterface } from './../repositories/downDetectorChangeRepository'
import { downDetectorHistInterface } from './../repositories/downDetectorHistRepository'
import { downDetectorSearchResult } from './../interfaces/downDetector'

const processName = process.env.name || 'primary'

export default async function routinesRequests(serverIo: Server, browser: puppeteer.Browser, updateTime: number) {  
  const requests = await servicesRepository.index({ update_time: updateTime, habilitado: 1 })
    .then(services => services)
    .catch(error => console.log('error', error))
  
  const lastExecution = moment().format('YYYY-MM-DD HH:mm:ss')
  
  const RedisKey = `downDetectorRoutine_${updateTime}`
  const completeRedisKey = `finished_routine_${updateTime}`

  if (!!requests && requests.length > 0) {
    const completeKeyStatus = await client.get(completeRedisKey)
    
    if (Number(completeKeyStatus) === 2) {
      return
    } else {
      await client.set(completeRedisKey, 2)
      await client.expire(completeRedisKey, 240)
    }
    
    console.log(`
    --> Requisitando serviços de update em ${updateTime} minuto(s)\n
    --> Requisitando ${requests.length} serviços\n
    --> começo da execução:', ${moment().subtract(3, 'hours').format('YYYY-MM-DD HH:mm:ss')}
    `)

    await downDetectorController.emitExecutionRoutine(serverIo, updateTime)

    const requestsResultsPromises = requests.map(async (request, index) => {
      const result = await downDetectorController.accessDownDetectorRoutine(request.service_name, browser)
        .catch(error => {
          console.log('error em: ', request.service_name)
          console.log(error)
          return undefined
        })

      // console.log(`-> (${index + 1}) ${request.service_name} da rotina ${updateTime} minuto(s), status: ${result?.status}`)
    })

    await Promise.all(requestsResultsPromises)
    await client.set(completeRedisKey, 1)
    
    console.log(`
      --> Final da execução: ${moment().subtract(3, 'hours').format('YYYY-MM-DD HH:mm:ss')}\n
      --> Requisições da rotina de ${updateTime} minuto(s) finalizadas\n
    `)
  }

  await downDetectorController.createOrUpdateServiceUpdateTime(updateTime, lastExecution)
  await downDetectorController.emitUpdateTime(serverIo)

  await downDetectorRoutineExecutionRepository.update(updateTime, 1)
}