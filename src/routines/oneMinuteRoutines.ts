import { Server } from 'socket.io'

import puppeteer from 'puppeteer'

import {
  downDetectorController
} from './../controllers'

import {
  monitoringRepository,
  servicesRepository
} from './../repositories'

import { pageInstanceInterface } from './../interfaces/routines'

async function updateOrCreateMonitoringService(name: string, content: string) {
  const monitoring = await monitoringRepository.get({ name })
    .catch(error => console.error(error))

  if (!monitoring) {
    await monitoringRepository.create({
      name,
      content
    })
  } else {
    await monitoringRepository.update({
      name, content
    })
  }
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
        
        await updateOrCreateMonitoringService(request.service_name, JSON.stringify(result))
      })

      await Promise.all(requestsResultsPromises)
      await emitUpdatedMonitoring(serverIo)

      console.log('requisições finalizadas')
  }
  // if (instancesArray.length > 0) {

  //   const requestsResultsPromises = instancesArray.map(async (instance) => {
  //     // const result = await downDetectorController.accessDownDetectorRoutine(instance.serviceName, instance.pageInstance)
    
  //     // await updateOrCreateMonitoringService(instance.serviceName, JSON.stringify(result))
  //   })

  //   await Promise.all(requestsResultsPromises)

  //   await emitUpdatedMonitoring(serverIo)

  // }  
}