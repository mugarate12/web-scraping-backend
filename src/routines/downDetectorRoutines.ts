import { Server } from 'socket.io'
import puppeteer from 'puppeteer'
import moment from 'moment'

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

function haveBaselineOrReportsInHour(histories: Array<any>, baseline: number, reports: number) {
  let have = false

  histories.forEach((history) => {
    if (history.baseline === baseline && history.notification_count === reports) {
      have = true
    }
  })

  return have
}

async function updateOrCreateMonitoringService(downDetectorResult: downDetectorSearchResult) {
  const normalizedData = normalizeDownDetectorResult(downDetectorResult)
  
  const registryDataPromises = normalizedData.map(async (downDetectorReport) => {
    let createRegistry = false

    await downDetectorHistRepository.index({
      serviceURL: downDetectorResult.url,
      dates: [ downDetectorReport.date.split(':')[0] ]
    })
      .then(response => {
        createRegistry = !haveBaselineOrReportsInHour(response, downDetectorReport.baseline, downDetectorReport.notificationCount)
      })
      .catch(error => {
        console.log(error)
      })
    
    if (createRegistry) {
      await downDetectorHistRepository.create({
        site_d: downDetectorResult.url,
        hist_date: downDetectorReport.date,
        baseline: downDetectorReport.baseline,
        notification_count: downDetectorReport.notificationCount
      })
        .catch(error => {})
    }
  })

  await downDetectorController.updateChangeHistory(downDetectorResult)

  await Promise.all(registryDataPromises)
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
    const routine = await downDetectorRoutineExecutionRepository.get(updateTime)

    if (!!routine && routine.execution === 2) {
      return
    } else {
      await downDetectorRoutineExecutionRepository.update(updateTime, 2)
    }

    sleep(200)

    console.log(`requisitando serviços de update em ${updateTime} minuto(s)`)

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

    await downDetectorController.createOrUpdateServiceUpdateTime(updateTime)
    await downDetectorController.emitUpdateTime(serverIo)
    await downDetectorRoutineExecutionRepository.update(updateTime, 1)
    // await emitUpdatedMonitoring(serverIo)

    console.log('requisições finalizadas')
  }
}