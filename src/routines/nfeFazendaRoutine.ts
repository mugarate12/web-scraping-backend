import CronJob from 'cron'
import dotenv from 'dotenv'
import moment from 'moment'

import {
  nfseFazendaController
} from './../controllers'

import { 
  FgWhite,
  Reset 
} from './../utils/colorsInTerminalReference'

dotenv.config()

async function nfeRoutine() {
  console.log(`${FgWhite}%s${Reset}`, `
    NFE FAZENDA --> atualizando dados da NFE Fazenda
    NFE FAZENDA --> começo da execução: ${moment().subtract(3, 'hours').format('YYYY-MM-DD HH:mm:ss')}
    `)

    await nfseFazendaController.runRoutine()
  
    console.log(`${FgWhite}%s${Reset}`, `
    NFE FAZENDA --> fim da execução: ${moment().subtract(3, 'hours').format('YYYY-MM-DD HH:mm:ss')}
    `)
}

export default async () => {
  const oneMinuteRoutine = new CronJob.CronJob('* * * * *', async () => {
    await nfeRoutine()
  })

  oneMinuteRoutine.start()
}