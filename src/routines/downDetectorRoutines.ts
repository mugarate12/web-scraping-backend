import { Server } from 'socket.io'
import puppeteer from 'puppeteer'
import moment from 'moment'
// import Redis from 'promise-redis'

// const redis = Redis()
// const client = redis.createClient()

// client.on("error", (error) => {
//   console.error(error);
// })

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

import { downDetectorChangeInterface } from './../repositories/downDetectorChangeRepository'
import { downDetectorHistInterface } from './../repositories/downDetectorHistRepository'
import { downDetectorSearchResult } from './../interfaces/downDetector'

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


export default async function routinesRequests(serverIo: Server, browser: puppeteer.Browser, updateTime: number) {  
  const requests = await servicesRepository.index({ update_time: updateTime, habilitado: 1 })
    .then(services => services)
    .catch(error => console.log('error', error))
  
  const lastExecution = moment().format('YYYY-MM-DD HH:mm:ss')
  
  if (!!requests && requests.length > 0) {
    const RedisKey = `downDetectorRoutine_${updateTime}`

    sleep(200 * Math.random() * 100)
    // const routineStatus = await client.get(RedisKey)

    // if (Number(routineStatus) === 2) {
    //   return
    // } else {
    //   await client.set(RedisKey, 2)
    //   await client.expire(RedisKey, 40)
    // }

    console.log(`requisitando serviços de update em ${updateTime} minuto(s) \n`)

    await downDetectorController.emitExecutionRoutine(serverIo, updateTime)
    
    const requestsResultsPromises = requests.map(async (request) => {
      const result = await downDetectorController.accessDownDetectorRoutine(request.service_name, browser)
        .catch(error => {
          console.log(error)
          return undefined
        })
      
      if (!!result) {
        await updateOrCreateMonitoringService(result)
      }
    })

    await Promise.all(requestsResultsPromises)
    
    // await client.set(RedisKey, 1)
    
    console.log('\nrequisições finalizadas\n')
  }
  await downDetectorController.createOrUpdateServiceUpdateTime(updateTime, lastExecution)
  await downDetectorController.emitUpdateTime(serverIo)

  await downDetectorRoutineExecutionRepository.update(updateTime, 1)
}