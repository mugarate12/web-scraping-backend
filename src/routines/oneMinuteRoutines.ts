import { Server } from 'socket.io'
import puppeteer from 'puppeteer'
import moment from 'moment'

import {
  downDetectorController
} from './../controllers'

import {
  downDetectorHistRepository,
  monitoringRepository,
  servicesRepository
} from './../repositories'

import { pageInstanceInterface } from './../interfaces/routines'
import { downDetectorSearchResult } from './../interfaces/downDetector'

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
  const downDetectorHistory = await downDetectorHistRepository.index({ serviceURL: downDetectorResult.url })

  const normalizedData = normalizeDownDetectorResult(downDetectorResult)
  
  const registryDataPromises = normalizedData.map(async (downDetectorReport) => {
    let haveRegistry = false

    downDetectorHistory.forEach((history) => {
      if (history.hist_date === downDetectorReport.date) {
        haveRegistry = true
      }
    })

    if (!haveRegistry) {
      await downDetectorHistRepository.create({
        site_d: downDetectorResult.url,
        hist_date: downDetectorReport.date,
        baseline: downDetectorReport.baseline,
        notification_count: downDetectorReport.notificationCount
      })
    }
  })

  await Promise.all(registryDataPromises)
}

async function emitUpdatedMonitoring(serverIo: Server) {
  const emittedCall = 'monitoring-updated'

  const monitoring = await monitoringRepository.index()

  serverIo.emit(emittedCall, monitoring)
}

export default async function oneMinuteRoutinesRequests(serverIo: Server, browser: puppeteer.Browser) {  
  const requests = await servicesRepository.index({ update_time: 1 })
    .then(services => services)
    .catch(error => console.log('error', error))
  
  if (!!requests && requests.length > 0) {
      console.log('requisitando serviços de update em um minuto')
      
      const requestsResultsPromises = requests.map(async (request) => {
        const result = await downDetectorController.accessDownDetectorRoutine(request.service_name, browser)
        
        await updateOrCreateMonitoringService(result)
      })

      await Promise.all(requestsResultsPromises)
      // await emitUpdatedMonitoring(serverIo)

      console.log('requisições finalizadas')
  }
}