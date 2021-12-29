import CronJob from 'cron'
import dotenv from 'dotenv'

import { cpflSearchRepository, cpflSearchNowRepository } from './../repositories'
import { cpflController } from './../controllers'

dotenv.config()

async function routine(updateTime: number) {
  const requests = await cpflSearchRepository.index({ able: 1, dealership: 'cpfl', update_time: updateTime })

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
  const fifteenRoutine = new CronJob.CronJob('*/15 * * * *', async () => {
    await routine(15)
  })
  
  const thirtyRoutine = new CronJob.CronJob('*/30 * * * *', async () => {
    await routine(30)
  })
  
  const fortyFiveRoutine = new CronJob.CronJob('*/45 * * * *', async () => {
    await routine(45)
  })
  
  const sixtyRoutine = new CronJob.CronJob('*/60 * * * *', async () => {
    await routine(60)
  })

  const updateTimeRoutine = new CronJob.CronJob('* * * * *', async () => {
    await updateRoutine()
  })

  const updateServicesAddedRoutine = new CronJob.CronJob('* * * * *', async () => {
    await updateServicesAdded()
  })

  fifteenRoutine.start()
  thirtyRoutine.start()
  fortyFiveRoutine.start()
  sixtyRoutine.start()
  // updateTimeRoutine.start()
  updateServicesAddedRoutine.start()
}