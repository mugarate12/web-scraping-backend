import CronJob from 'cron'
import dotenv from 'dotenv'
import moment from 'moment'

import {
  apiAccessClientsRepository
} from './../repositories'
import { FgCyan, FgBlue, Reset } from './../utils/colorsInTerminalReference'

dotenv.config()

async function routine() {
  const requests = await apiAccessClientsRepository.index()

  if (requests.length > 0) {
    console.log(`${FgBlue}%s${Reset}`, `
    ENERGY --> Executando verificação de chaves expiradas\n
    ENERGY --> Quantidade de chaves: ${requests.length}\n
    ENERGY --> começo da execução: ${moment().subtract(3, 'hours').format('YYYY-MM-DD HH:mm:ss')}
    `)
    let expiredKeysCount = 0
    const actualDate = moment().subtract(3, 'hours').format('DD-MM-YYYY')
    
    for (let index = 0; index < requests.length; index++) {
      let update = false

      const request = requests[index]
      const requestDate = request.expiration_time
      const requestDateMonth = requestDate.split('-')[1]
      const requestDateYear = requestDate.split('-')[2]

      const actualDateMonth = actualDate.split('-')[1]
      const actualDateYear = actualDate.split('-')[2]

      if (actualDateYear > requestDateYear) {
        update = true
      } else if (actualDateYear === requestDateYear && actualDateMonth > requestDateMonth) {
        update = true
      }

      if (update) {
        await apiAccessClientsRepository.update({
          identifiers: {
            id: request.id
          },
          payload: {
            able: 2
          }
        })

        expiredKeysCount += 1
      }
    }

  
    console.log(`${FgBlue}%s${Reset}`, `
      ENERGY --> Final da execução: ${moment().subtract(3, 'hours').format('YYYY-MM-DD HH:mm:ss')}\n
      ENERGY --> ${expiredKeysCount} expiradas\n
    `)
  }
}

export default async () => {
  const verifyExpiredKeysRoutine = new CronJob.CronJob('0 8 * * *', async () => {
    await routine()
  })

  verifyExpiredKeysRoutine.start()
}