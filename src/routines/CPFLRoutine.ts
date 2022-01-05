import CronJob from 'cron'
import dotenv from 'dotenv'
import moment from 'moment'
import puppeteer from 'puppeteer'

import { cpflSearchRepository, cpflSearchNowRepository, cpflSearchUpdateTimeRepository } from './../repositories'
import { cpflController } from './../controllers'
import { FgCyan, FgBlue, Reset } from './../utils/colorsInTerminalReference'

import { CPFFSearchInterface } from './../repositories/CPFLSearchRepository'

dotenv.config()

function createHeadquarterOfRequests(requests: CPFFSearchInterface[]) {
  let result: Array<Array<CPFFSearchInterface>> = []
  let array: Array<CPFFSearchInterface> = []

  requests.forEach((request, index) => {
    const haveTeenElements = (index + 1) % 5 === 0
    const isFinalOfRequests = (index + 1) === requests.length
    
    if (haveTeenElements || isFinalOfRequests) {
      array.push(request)
      result.push(array)

      array = []
    } else {
      array.push(request)
    }
  })

  return result
}

function stepLog(updateTime: number, step: number) {
  console.log(`${FgBlue}%s${Reset}`, `
      ENERGY --> parte ${step} da rotina de ${updateTime} minuto(s) finalizada
  `)
}

async function routine(browser: puppeteer.Browser, updateTime: number) {
  const requests = await cpflSearchRepository.index({ able: 1, dealership: 'cpfl', update_time: updateTime })

  if (requests.length > 0) {
    console.log(`${FgBlue}%s${Reset}`, `
    ENERGY --> Requisitando serviços de update em ${updateTime} minuto(s)\n
    ENERGY --> Requisitando ${requests.length} serviços\n
    ENERGY --> começo da execução: ${moment().subtract(3, 'hours').format('YYYY-MM-DD HH:mm:ss')}
    `)

    const lastExecution = moment().subtract(3, 'hours').format('YYYY-MM-DD HH:mm:ss')
    // const browser = await cpflController.runBrowser()

    const headquarter = createHeadquarterOfRequests(requests)

    for (let index = 0; index < headquarter.length; index++) {
      const arrayOfRequests = headquarter[index]
      
      const requestsPromises = arrayOfRequests.map(async (request) => {
        await cpflController.runCpflRoutine(browser, request.state, request.city)
          .catch(error => {})

        await cpflSearchUpdateTimeRepository.update({ cpfl_search_FK: request.id, last_execution: lastExecution })
      })

      await Promise.all([ ...requestsPromises ])
      stepLog(updateTime, index + 1)
    }

    // await cpflController.closeBrowser(browser)
  
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

async function updateServicesAdded(browser: puppeteer.Browser) {
  const requests = await cpflSearchNowRepository.index()

  if (requests.length > 0) {
    console.log(`${FgCyan}%s${Reset}`, `
    ENERGY --> Requisitando serviços recém adicionados\n
    ENERGY --> Requisitando ${requests.length} serviços\n
    ENERGY --> começo da execução: ${moment().subtract(3, 'hours').format('YYYY-MM-DD HH:mm:ss')}
    `)

    // const browser = await cpflController.runBrowser()

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

async function deleteDataWithStatusFinished() {
  console.log(`${FgBlue}%s${Reset}`, `
    ENERGY --> Rotina para deletar todos os serviços que foram finalizados (status 4)\n
    ENERGY --> começo da execução: ${moment().subtract(3, 'hours').format('YYYY-MM-DD HH:mm:ss')}
    `)

  await cpflController.deleteAllDataWithStatusFinished()

  console.log(`${FgBlue}%s${Reset}`, `
    ENERGY --> Rotina para deletar todos os serviços que foram finalizados (status 4)\n
    ENERGY --> final da execução: ${moment().subtract(3, 'hours').format('YYYY-MM-DD HH:mm:ss')}
    `)
}

export default async () => {
  const fifteenMinutesBrowser = await cpflController.runBrowser()
  const thirtyMinutesBrowser = await cpflController.runBrowser()
  const fortyFiveMinutesBrowser = await cpflController.runBrowser()
  const sixtyMinutesBrowser = await cpflController.runBrowser()

  const serviceAddedBrowser = await cpflController.runBrowser()

  const fifteenRoutine = new CronJob.CronJob('*/15 * * * *', async () => {
    await routine(fifteenMinutesBrowser, 15)
  })
  
  const thirtyRoutine = new CronJob.CronJob('*/30 * * * *', async () => {
    await routine(thirtyMinutesBrowser, 30)
  })
  
  const fortyFiveRoutine = new CronJob.CronJob('*/45 * * * *', async () => {
    await routine(fortyFiveMinutesBrowser, 45)
  })
  
  const sixtyRoutine = new CronJob.CronJob('*/60 * * * *', async () => {
    await routine(sixtyMinutesBrowser, 60)
  })

  const updateTimeRoutine = new CronJob.CronJob('* * * * *', async () => {
    await updateRoutine()
  })

  const updateServicesAddedRoutine = new CronJob.CronJob('* * * * *', async () => {
    await updateServicesAdded(serviceAddedBrowser)
  })

  const deleteDataWithStatusFinishedRoutine = new CronJob.CronJob('15 0 * * *', async () => {
    await deleteDataWithStatusFinished()
  })

  fifteenRoutine.start()
  thirtyRoutine.start()
  fortyFiveRoutine.start()
  sixtyRoutine.start()

  updateServicesAddedRoutine.start()
  
  updateTimeRoutine.start()
  deleteDataWithStatusFinishedRoutine.start()
}