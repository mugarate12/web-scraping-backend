import CronJob from 'cron'
import dotenv from 'dotenv'
import moment from 'moment'

import { cpflSearchRepository, cpflSearchNowRepository } from './../repositories'
import { cpflController } from './../controllers'
import { FgCyan, FgBlue, Reset } from './../utils/colorsInTerminalReference'

dotenv.config()

async function routine(updateTime: number) {
  const requests = await cpflSearchRepository.index({ able: 1, dealership: 'cpfl', update_time: updateTime })

  if (requests.length > 0) {
    console.log(`${FgBlue}%s${Reset}`, `
    ENERGY --> Requisitando serviços de update em ${updateTime} minuto(s)\n
    ENERGY --> Requisitando ${requests.length} serviços\n
    ENERGY --> começo da execução: ${moment().subtract(3, 'hours').format('YYYY-MM-DD HH:mm:ss')}
    `)


    const browser = await cpflController.runBrowser()

    for (let index = 0; index < requests.length; index++) {
      const search = requests[index]
      
      await cpflController.runCpflRoutine(browser, search.state, search.city)
    }

    await cpflController.closeBrowser(browser)
  
    console.log(`${FgBlue}%s${Reset}`, `
      ENERGY --> Final da execução: ${moment().subtract(3, 'hours').format('YYYY-MM-DD HH:mm:ss')}\n
      ENERGY --> Requisições da rotina de ${updateTime} minuto(s) finalizadas\n
    `)
  }
}

async function updateRoutine() {
  const requests = await cpflSearchRepository.index({ able: 1 })

  if (requests.length > 0) {
    for (let index = 0; index < requests.length; index++) {
      const search = requests[index]
      
      await cpflController.runUpdateTimeRoutine(search.state, search.city)
    }
  }
}

async function updateServicesAdded() {
  const requests = await cpflSearchNowRepository.index()

  if (requests.length > 0) {
    console.log(`${FgCyan}%s${Reset}`, `
    ENERGY --> Requisitando serviços recém adicionados\n
    ENERGY --> Requisitando ${requests.length} serviços\n
    ENERGY --> começo da execução: ${moment().subtract(3, 'hours').format('YYYY-MM-DD HH:mm:ss')}
    `)

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

    console.log(`${FgCyan}%s${Reset}`, `
      ENERGY --> Final da execução: ${moment().subtract(3, 'hours').format('YYYY-MM-DD HH:mm:ss')}\n
      ENERGY --> Requisições da rotina de serviços recém adicionados\n
    `)  }
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