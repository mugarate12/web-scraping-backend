import {
  downDetectorController
} from './../controllers'

import {
  servicesRepository
} from './../repositories'

export default async function oneMinuteRoutinesRequests() {
  const requests = await servicesRepository.index({ update_time: 1 })
    .then(services => services)
    .catch(error => console.log('error', error))

  if (!!requests) {
    for (let index = 0; index < requests.length; index++) {
      const request = requests[index]
      
      console.log(`${request.service_name} routine`)
      await downDetectorController.accessDownDetectorRoutine(request.service_name)
      console.log(`${request.service_name} routine`)
    }
  }

}