import { Server } from 'socket.io'

import {
  downDetectorController
} from './../controllers'

import {
  monitoringRepository,
  servicesRepository
} from './../repositories'

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

export default async function oneMinuteRoutinesRequests(serverIo: Server) {
  const requests = await servicesRepository.index({ update_time: 1 })
    .then(services => services)
    .catch(error => console.log('error', error))

  if (!!requests) {
    console.log('requisitando serviços de update em um minuto')

    const requestsPromisses = requests.map(async (request) => {
      const result = await downDetectorController.accessDownDetectorRoutine(request.service_name)

      await updateOrCreateMonitoringService(request.service_name, JSON.stringify(result))
    })
    
    await Promise.all(requestsPromisses)

    await emitUpdatedMonitoring(serverIo)
    
    console.log('requisições finalizadas')

    // for (let index = 0; index < requests.length; index++) {
    //   const request = requests[index]
      
    //   console.log(`${request.service_name} routine started`)
    //   const result = await downDetectorController.accessDownDetectorRoutine(request.service_name)

    //   await updateOrCreateMonitoringService(request.service_name, JSON.stringify(result))

    //   await emitUpdatedMonitoring(serverIo)

    //   console.log(`${request.service_name} routine finished`)
    // }
  }

}