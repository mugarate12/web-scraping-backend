import CronJob from 'cron'
import dotenv from 'dotenv'
import moment from 'moment'

import { ocrController } from './../controllers'
import { FgCyan, FgBlue, Reset } from './../utils/colorsInTerminalReference'

dotenv.config()

function initialLog(description: string) {
  console.log(`${FgBlue}%s${Reset}`, `
    OCR --> Executando coletas ${description}\n
    OCR --> começo da execução: ${moment().subtract(3, 'hours').format('YYYY-MM-DD HH:mm:ss')}
    `)
}

function finalLog() {
  console.log(`${FgBlue}%s${Reset}`, `
    OCR --> Final da execução: ${moment().subtract(3, 'hours').format('YYYY-MM-DD HH:mm:ss')}\n
  `)
}

async function update() {
  await ocrController.runRoutine()
}

export default async () => {
  const ocrRoutine = new CronJob.CronJob('*/5 * * * *', async () => {
    initialLog('de todas com exceção SP')

    await update()

    finalLog()
  })

  const ocrRoutineTeenMinutes = new CronJob.CronJob('*/10 * * * *', async () => {
    initialLog('de SP')

    await ocrController.runRoutineTeenMinutes()

    finalLog()
  }) 

  ocrRoutine.start()
  ocrRoutineTeenMinutes.start()
}