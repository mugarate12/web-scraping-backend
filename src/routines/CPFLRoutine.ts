import CronJob from 'cron'
import dotenv from 'dotenv'

import { cpflSearchRepository, cpflSearchNowRepository } from './../repositories'
import { cpflController } from './../controllers'

dotenv.config()

async function routine() {
  const requests = await cpflSearchRepository.index({ able: 1 })

  if (requests.length > 0) {
    console.log(`iniciando rotina da CPFL`)

    const browser = await cpflController.runBrowser()

    for (let index = 0; index < requests.length; index++) {
      const search = requests[index]
      
      await cpflController.runCpflRoutine(browser, search.state, search.city)
    }

    await cpflController.closeBrowser(browser)
  
    console.log(`finalizando rotina da CPFL`)
  }
}

async function updateRoutine() {
  const requests = await cpflSearchRepository.index({ able: 1 })

  if (requests.length > 0) {
    console.log('iniciando rotina de atualização do tempo da CPFL')

    for (let index = 0; index < requests.length; index++) {
      const search = requests[index]
      
      await cpflController.runUpdateTimeRoutine(search.state, search.city)
    }
    console.log('finalizando rotina de atualização do tempo da CPFL')
  }
}

async function updateServicesAdded() {
  const requests = await cpflSearchNowRepository.index()

  if (requests.length > 0) {
    console.log('iniciando rotina de aquisição de um novo serviço')

    const browser = await cpflController.runBrowser()

    for (let index = 0; index < requests.length; index++) {
      const search = requests[index]
      
      await cpflController.runCpflRoutine(browser, search.state, search.city)
    }

    for (let index = 0; index < requests.length; index++) {
      const search = requests[index]

      await cpflSearchNowRepository.delete({
        state: search.state,
        city: search.city
      })
    }

    await cpflController.closeBrowser(browser)

    console.log('finalizando rotina de aquisição de um novo serviço')
  }
}

export default () => {
  const everyHourRoutine = new CronJob.CronJob('0 * * * *', async () => {
    await routine()
  })

  const updateTimeRoutine = new CronJob.CronJob('* * * * *', async () => {
    await updateRoutine()
  })

  const updateServicesAddedRoutine = new CronJob.CronJob('* * * * *', async () => {
    await updateServicesAdded()
  })

  everyHourRoutine.start()
  // updateTimeRoutine.start()
  updateServicesAddedRoutine.start()
}