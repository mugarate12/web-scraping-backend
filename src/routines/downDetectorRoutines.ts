import { Server } from 'socket.io'
import puppeteer from 'puppeteer'
import moment from 'moment'
import Redis from 'promise-redis'

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

async function runBrowser() {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'], slowMo: 200 })
  return browser
}

async function sleep(milliseconds: number) {
  return new Promise(resolve => setTimeout(resolve, milliseconds))
}

function normalizeDownDetectorResult(downDetectorResult: downDetectorSearchResult) {
  const baselines = downDetectorResult.baseline
  const reports = downDetectorResult.reports

  const data = baselines.map((baseline, index) => {
    return {
      date: moment(baseline.x).format('YYYY-MM-DD HH:mm:ss'),
      baseline: baseline.y,
      notificationCount: reports[index].y
    }
  })

  return data
}

async function updateOrCreateMonitoringService(downDetectorResult: downDetectorSearchResult) {
  const normalizedData = normalizeDownDetectorResult(downDetectorResult)
  let insertions: Array<{
      site_d: string,
      hist_date: string,
      baseline: number,
      notification_count: number
    }> = []

  for (let index = 0; index < normalizedData.length; index++) {
    const report = normalizedData[index]

    insertions.push({
      site_d: downDetectorResult.url,
      hist_date: report.date,
      baseline: report.baseline,
      notification_count: report.notificationCount
    })
  }

  await downDetectorController.updateChangeHistory(downDetectorResult)

  if (insertions.length > 0) {
    await downDetectorHistRepository.createInMassive(insertions)
      .catch(error => {
        console.log(error);
      })
  }
}

function createArraysOfRequests(requests: serviceInterface[], numberOfMultipleTabs: number) {
  let arraysOfRequests: Array<Array<serviceInterface>> = []
  let maintenanceArray: Array<serviceInterface> = []

  requests.forEach((element, index) => {
    if ((index + 1) % numberOfMultipleTabs === 0) {
      arraysOfRequests.push(maintenanceArray)
      maintenanceArray = []
    }

    if ((index + 1) === requests.length) {
      maintenanceArray.push(element)
      arraysOfRequests.push(maintenanceArray)
    } else {
      maintenanceArray.push(element)
    }
  })

  return arraysOfRequests
}

export default async function routinesRequests(serverIo: Server, browser: puppeteer.Browser, updateTime: number) {  
  const requests = await servicesRepository.index({ update_time: updateTime, habilitado: 1 })
    .then(services => services)
    .catch(error => console.log('error', error))
  
  const lastExecution = moment().format('YYYY-MM-DD HH:mm:ss')
  
  const RedisKey = `downDetectorRoutine_${updateTime}`
  const completeRedisKey = `finished_routine_${updateTime}`

  
  if (!!requests && requests.length > 0) {
    sleep(200 * Math.random() * 100)
    const routineStatus = await client.get(RedisKey)
    const completeKeyStatus = await client.get(completeRedisKey)

    // console.log('routine: ', updateTime, ' routine status: ', routineStatus);
    // console.log(completeKeyStatus);

    // console.log('complete status:', completeKeyStatus);
    
    if (Number(completeKeyStatus) === 2) {
      return
    } else {
      await client.set(completeRedisKey, 2)
    }

    console.log('--> start da execução:', lastExecution)

    console.log(`--> Requisitando serviços de update em ${updateTime} minuto(s) \n`)
    console.log(`--> Requisitando ${requests.length} serviços`)

    await downDetectorController.emitExecutionRoutine(serverIo, updateTime)
    // const arraysOfRequests = createArraysOfRequests(requests, 10)

    // for (let index = 0; index < arraysOfRequests.length; index++) {
    //   const fiveRequests = arraysOfRequests[index]

    //   const requestsResultsPromises = fiveRequests.map(async (request) => {
    //     await downDetectorController.accessDownDetectorRoutine(request.service_name, browser)
    //       .catch(error => {
    //         console.log('error em', request.service_name)
    //         console.log(error)
    //         return undefined
    //       })
    //   })
  
    //   await Promise.all(requestsResultsPromises)
    // }

    const requestsResultsPromises = requests.map(async (request) => {
      const result = await downDetectorController.accessDownDetectorRoutine(request.service_name, browser)
        .catch(error => {
          console.log('error em', request.service_name)
          console.log(error)
          return undefined
        })

      console.log(`-> ${request.service_name} da rotina ${updateTime} minuto(s), status: ${result?.status}`)
    })

    await Promise.all(requestsResultsPromises)
    
    // await client.set(RedisKey, 1)
    
    await client.set(completeRedisKey, 1)
    console.log(`\n--> Requisições da rotina de ${updateTime} minuto(s) finalizadas\n`)
  }

  await downDetectorController.createOrUpdateServiceUpdateTime(updateTime, lastExecution)
  await downDetectorController.emitUpdateTime(serverIo)

  await downDetectorRoutineExecutionRepository.update(updateTime, 1)
}