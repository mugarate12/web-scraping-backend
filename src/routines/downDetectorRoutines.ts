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

function haveBaselineOrReportsInHour(histories: Array<downDetectorHistInterface>, baseline: number, reports: number) {
  let have = false

  histories.forEach((history) => {
    if (history.baseline === baseline && history.notification_count === reports) {
      have = true
    }
  })

  return have
}

async function haveDocumentWithDate(downDetectorReport: {
  date: string;
  baseline: number;
  notificationCount: number;
}) {
  let have = false

  await downDetectorHistRepository.get(downDetectorReport.date)
    .then(history => {
      if (!!history) {
        have = true
      }
    })

  return have
}

async function updateOrCreateMonitoringService(downDetectorResult: downDetectorSearchResult) {
  const normalizedData = normalizeDownDetectorResult(downDetectorResult)
  let insertions: Array<{
      site_d: string,
      hist_date: string,
      baseline: number,
      notification_count: number
    }> = []

  const requests = normalizedData.map(async (report) => {
    const histories = await downDetectorHistRepository.indexWithOneDate({ serviceURL: downDetectorResult.url, date: report.date.split(':')[0] })
    const haveSameBaselineAndReport = haveBaselineOrReportsInHour(histories, report.baseline, report.notificationCount)

    if (!haveSameBaselineAndReport) {
      insertions.push({
        site_d: downDetectorResult.url,
        hist_date: report.date,
        baseline: report.baseline,
        notification_count: report.notificationCount
      })
    }
  })

  await Promise.all(requests)

  await downDetectorHistRepository.createInMassive(insertions)
    .catch(error => {
      console.log(error);
    })

  // const actualDate = moment().format('YYYY-MM-DD')
  // const lessOneDay = moment().subtract(1, 'days').format('YYYY-MM-DD')

  // const validDatesWithUndefinedRequests = normalizedData.map(async (downDetectorReport) => {
  //   const have = await haveDocumentWithDate(downDetectorReport)

  //   if (have) {
  //     return undefined
  //   } else {
  //     return downDetectorReport
  //   }
  // })
  // const validDatesWithUndefined = await Promise.all(validDatesWithUndefinedRequests)

  // const validDatesFiltered = validDatesWithUndefined.filter((report) => report !== undefined)
  // const validNumberOfBaselinesAndReportsWithUndefinedRequests = validDatesFiltered.map(async (report) => {
  //   let createRegistry = false

  //   if (!!report) {
  //     await downDetectorHistRepository.get(report.date.split(':')[0])
  //       .then(history => {
  //         if (!!history) {
  //           createRegistry = true
  //         }
  //       })
  //       .catch(error => {
  //         console.log('get error');
  //       })
  //   }

  //   if (createRegistry) {
  //     return report
  //   } else {
  //     return undefined
  //   }
  // })

  // const validNumberOfBaselinesAndReportsWithUndefined = await Promise.all(validNumberOfBaselinesAndReportsWithUndefinedRequests)
  // const validNumberOfBaselinesAndReports = validNumberOfBaselinesAndReportsWithUndefined.filter(report => report !== undefined)

  // let insertions: Array<{
  //   site_d: string,
  //   hist_date: string,
  //   baseline: number,
  //   notification_count: number
  // }> = []

  // validNumberOfBaselinesAndReports.forEach((report) => {
  //   if (!!report) {
  //     insertions.push({
  //       site_d: downDetectorResult.url,
  //       hist_date: report.date,
  //       baseline: report.baseline,
  //       notification_count: report.notificationCount
  //     })
  //   }
  // })

  // let insertionsWithoutDuplicateDate: Array<{
  //   site_d: string,
  //   hist_date: string,
  //   baseline: number,
  //   notification_count: number
  // }> = []

  // insertions.forEach((report) => {
  //   let have = false

  //   insertionsWithoutDuplicateDate.forEach(insertion => {
  //     if (insertion.hist_date === report.hist_date) {
  //       have = true
  //     }
  //   })

  //   if (!have) {
  //     insertionsWithoutDuplicateDate.push(report)
  //   }
  // })

  // if (insertionsWithoutDuplicateDate.length > 0) {
  //   await downDetectorHistRepository.createInMassive(insertionsWithoutDuplicateDate)
  //     .catch(error => {
  //       console.log(error);
  //     })
  // }
}

async function emitUpdatedMonitoring(serverIo: Server) {
  const emittedCall = 'monitoring-updated'

  const monitoring = await monitoringRepository.index()

  serverIo.emit(emittedCall, monitoring)
}

export default async function routinesRequests(serverIo: Server, browser: puppeteer.Browser, updateTime: number) {  
  const requests = await servicesRepository.index({ update_time: updateTime, habilitado: 1 })
    .then(services => services)
    .catch(error => console.log('error', error))
  
  if (!!requests && requests.length > 0) {
    const RedisKey = `downDetectorRoutine_${updateTime}`

    sleep(200 * Math.random() * 100)
    const routineStatus = await client.get(RedisKey)

    if (Number(routineStatus) === 2) {
      return
    } else {
      await client.set(RedisKey, 2)
    }

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

    // await downDetectorController.createOrUpdateServiceUpdateTime(updateTime)
    // await downDetectorController.emitUpdateTime(serverIo)
    await downDetectorRoutineExecutionRepository.update(updateTime, 1)
    await client.set(RedisKey, 1)
    // await emitUpdatedMonitoring(serverIo)

    console.log('\nrequisições finalizadas\n')
  }
}