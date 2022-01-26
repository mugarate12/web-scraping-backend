import CronJob from 'cron'
import dotenv from 'dotenv'
import moment from 'moment'

import { ocrController } from './../controllers'
import { FgCyan, FgBlue, Reset } from './../utils/colorsInTerminalReference'

dotenv.config()

function initialLog() {
  console.log(`${FgBlue}%s${Reset}`, `
    OCR --> Executando verificação de chaves expiradas\n
    OCR --> Quantidade de chaves: somente RJ\n
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
  const ocrRoutine = new CronJob.CronJob('*/15 * * * *', async () => {
    initialLog()

    await update()

    finalLog()
  })

  ocrRoutine.start()
}