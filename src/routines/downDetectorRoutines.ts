import { Server } from 'socket.io'
import puppeteer from 'puppeteer'
import moment from 'moment'

import {
  downDetectorController
} from './../controllers'

import {
  downDetectorChangeRepository,
  downDetectorHistRepository,
  monitoringRepository,
  servicesRepository
} from './../repositories'

import { downDetectorChangeInterface } from './../repositories/downDetectorChangeRepository'
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

function createStatusChangeString(lastRegistryOfChange: downDetectorChangeInterface[], downDetectorResult: downDetectorSearchResult) {
  if (lastRegistryOfChange.length > 0) {
    const lastRegistryStatusLetter = lastRegistryOfChange[0].status_atual[0].toUpperCase()
    const actualStatusLetter = downDetectorResult.status[0].toUpperCase()

    const change = `${lastRegistryStatusLetter}${actualStatusLetter}`

    return change
  } else {
    const actualStatusLetter = downDetectorResult.status[0].toUpperCase()

    return actualStatusLetter
  }
}

async function updateOrCreateMonitoringService(downDetectorResult: downDetectorSearchResult) {
  const normalizedData = normalizeDownDetectorResult(downDetectorResult)
  
  const registryDataPromises = normalizedData.map(async (downDetectorReport) => {
    await downDetectorHistRepository.create({
      site_d: downDetectorResult.url,
      hist_date: downDetectorReport.date,
      baseline: downDetectorReport.baseline,
      notification_count: downDetectorReport.notificationCount
    })
      .catch(error => {})
  })

  const lastRegistryOfChange = await downDetectorChangeRepository.index({
    identifiers: {
      serviceURL: downDetectorResult.url
    },
    orderBy: { property: 'id', orientation: 'desc' },
    limit: 1
  })

  if (lastRegistryOfChange.length === 0) {
    await downDetectorChangeRepository.create({
      site_c: downDetectorResult.url,
      hist_date: moment().format('YYYY-MM-DD HH:mm:ss'),
      status_anterior: '',
      status_atual: downDetectorResult.status,
      status_change: createStatusChangeString(lastRegistryOfChange, downDetectorResult)
    })
  }
 
  if (lastRegistryOfChange.length > 0 && lastRegistryOfChange[0].status_atual !== downDetectorResult.status) {
    await downDetectorChangeRepository.create({
      site_c: downDetectorResult.url,
      hist_date: moment().format('YYYY-MM-DD HH:mm:ss'),
      status_anterior: lastRegistryOfChange[0].status_atual,
      status_atual: downDetectorResult.status,
      status_change: createStatusChangeString(lastRegistryOfChange, downDetectorResult)
    })
  }

  await Promise.all(registryDataPromises)
}

async function emitUpdatedMonitoring(serverIo: Server) {
  const emittedCall = 'monitoring-updated'

  const monitoring = await monitoringRepository.index()

  serverIo.emit(emittedCall, monitoring)
}

export default async function routinesRequests(serverIo: Server, browser: puppeteer.Browser, updateTime: number) {  
  const requests = await servicesRepository.index({ update_time: updateTime })
    .then(services => services)
    .catch(error => console.log('error', error))
  
  if (!!requests && requests.length > 0) {
      console.log(`requisitando serviços de update em ${updateTime} minuto(s)`)
      
      const requestsResultsPromises = requests.map(async (request) => {
        const result = await downDetectorController.accessDownDetectorRoutine(request.service_name, browser)
        
        await updateOrCreateMonitoringService(result)
      })

      await Promise.all(requestsResultsPromises)
      // await emitUpdatedMonitoring(serverIo)

      console.log('requisições finalizadas')
  }
}