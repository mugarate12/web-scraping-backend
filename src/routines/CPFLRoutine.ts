import CronJob from 'cron'
import dotenv from 'dotenv'

import { cpflSearchRepository } from './../repositories'
import { cpflController } from './../controllers'

dotenv.config()

async function routine() {
  const requests = await cpflSearchRepository.index({ able: 1 })

  if (requests.length > 0) {
    console.log(`iniciando rotina da CPFL`)

    for (let index = 0; index < requests.length; index++) {
      const search = requests[index]
      
      await cpflController.runCpflRoutine(search.state, search.city)
    }
  
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

export default () => {
  const everyHourRoutine = new CronJob.CronJob('0 * * * *', async () => {
    await routine()
  })

  const updateTimeRoutine = new CronJob.CronJob('* * * * *', async () => {
    await updateRoutine()
  })

  everyHourRoutine.start()
  updateTimeRoutine.start()
}