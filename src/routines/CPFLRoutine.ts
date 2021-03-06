import CronJob from 'cron'
import dotenv from 'dotenv'
import moment from 'moment'
import puppeteer from 'puppeteer'

import { 
  cpflSearchRepository, 
  cpflSearchNowRepository, 
  cpflSearchUpdateTimeRepository
} from './../repositories'
import { 
  cpflController, 
  equatorialController,
  energisaController
} from './../controllers'
import { 
  FgCyan, 
  FgBlue, 
  FgMagenta,
  Reset 
} from './../utils/colorsInTerminalReference'

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

function stepInitialLog(updateTime: number, step: number) {
  console.log(`${FgBlue}%s${Reset}`, `
      ENERGY --> parte ${step} da rotina de ${updateTime} minuto(s) iniciada
  `)
}

function stepLog(updateTime: number, step: number, totalOfSteps: number) {
  console.log(`${FgBlue}%s${Reset}`, `
      ENERGY --> parte ${step} de ${totalOfSteps} da rotina de ${updateTime} minuto(s) finalizada
  `)
}

async function cpflRoutine(browser: puppeteer.Browser, updateTime: number) {
  const requests = await cpflSearchRepository.index({ able: 1, dealership: 'cpfl', update_time: updateTime })

  if (requests.length > 0) {
    console.log(`${FgBlue}%s${Reset}`, `
    ENERGY CPFL --> Requisitando serviços de update em ${updateTime} minuto(s)\n
    ENERGY CPFL --> Requisitando ${requests.length} serviços\n
    ENERGY CPFL --> começo da execução: ${moment().subtract(3, 'hours').format('YYYY-MM-DD HH:mm:ss')}
    `)

    const lastExecution = moment().subtract(3, 'hours').format('YYYY-MM-DD HH:mm:ss')
    // const browser = await cpflController.runBrowser()

    const headquarter = createHeadquarterOfRequests(requests)

    for (let index = 0; index < headquarter.length; index++) {
      const arrayOfRequests = headquarter[index]
      
      stepInitialLog(updateTime, index + 1)

      const requestsPromises = arrayOfRequests.map(async (request) => {
        await cpflController.runCpflRoutine(browser, request.state, request.city)
          .catch(error => {})

        await cpflSearchUpdateTimeRepository.update({ cpfl_search_FK: request.id, last_execution: lastExecution })
      })

      await Promise.all([ ...requestsPromises ])
      stepLog(updateTime, index + 1, headquarter.length)
    }

    // await cpflController.closeBrowser(browser)
  
    console.log(`${FgBlue}%s${Reset}`, `
      ENERGY CPFL --> Final da execução: ${moment().subtract(3, 'hours').format('YYYY-MM-DD HH:mm:ss')}\n
      ENERGY CPFL --> Requisições da rotina de ${updateTime} minuto(s) finalizadas\n
    `)
  }
}

async function equatorialRoutine(browser: puppeteer.Browser, updateTime: number) {
  const requests = await cpflSearchRepository.index({ able: 1, dealership: 'equatorial', update_time: updateTime })

  if (requests.length > 0) {
    console.log(`${FgBlue}%s${Reset}`, `
    ENERGY EQUATORIAL --> Requisitando serviços de update em ${updateTime} minuto(s)\n
    ENERGY EQUATORIAL --> Requisitando ${requests.length} serviços\n
    ENERGY EQUATORIAL --> começo da execução: ${moment().subtract(3, 'hours').format('YYYY-MM-DD HH:mm:ss')}
    `)

    const lastExecution = moment().subtract(3, 'hours').format('YYYY-MM-DD HH:mm:ss')

    const headquarter = createHeadquarterOfRequests(requests)

    for (let index = 0; index < headquarter.length; index++) {
      const arrayOfRequests = headquarter[index]
      
      const requestsPromises = arrayOfRequests.map(async (request) => {
        // await cpflController.runCpflRoutine(browser, request.state, request.city)
        //   .catch(error => {})
        await equatorialController.runRoutine(browser, request.state, request.city)
          .catch(error => {})

        await cpflSearchUpdateTimeRepository.update({ cpfl_search_FK: request.id, last_execution: lastExecution })
      })

      await Promise.all([ ...requestsPromises ])
      stepLog(updateTime, index + 1, headquarter.length)
    }

  
    console.log(`${FgBlue}%s${Reset}`, `
      ENERGY EQUATORIAL --> Final da execução: ${moment().subtract(3, 'hours').format('YYYY-MM-DD HH:mm:ss')}\n
      ENERGY EQUATORIAL --> Requisições da rotina de ${updateTime} minuto(s) finalizadas\n
    `)
  }
}

async function energisaRoutine(updateTime: number) {
  const requests = await cpflSearchRepository.index({ able: 1, dealership: 'energisa', update_time: updateTime })

  if (requests.length > 0) {
    console.log(`${FgMagenta}%s${Reset}`, `
    ENERGY ENERGISA --> Requisitando serviços de update em ${updateTime} minuto(s)\n
    ENERGY ENERGISA --> Requisitando ${requests.length} serviços\n
    ENERGY ENERGISA --> começo da execução: ${moment().subtract(3, 'hours').format('YYYY-MM-DD HH:mm:ss')}
    `)

    const lastExecution = moment().subtract(3, 'hours').format('YYYY-MM-DD HH:mm:ss')

    const headquarter = createHeadquarterOfRequests(requests)

    for (let index = 0; index < headquarter.length; index++) {
      const arrayOfRequests = headquarter[index]
      
      const requestsPromises = arrayOfRequests.map(async (request) => {

        await energisaController.runRoutine(request.state, request.city)

        await cpflSearchUpdateTimeRepository.update({ cpfl_search_FK: request.id, last_execution: lastExecution })
      })

      await Promise.all([ ...requestsPromises ])
      stepLog(updateTime, index + 1, headquarter.length)
    }
  
    console.log(`${FgMagenta}%s${Reset}`, `
      ENERGY ENERGISA --> Final da execução: ${moment().subtract(3, 'hours').format('YYYY-MM-DD HH:mm:ss')}\n
      ENERGY ENERGISA --> Requisições da rotina de ${updateTime} minuto(s) finalizadas\n
    `)
  }
}

async function updateRoutine() {
  const requests = await cpflSearchRepository.index({ able: 1 })

  if (requests.length > 0) {
    for (let index = 0; index < requests.length; index++) {
      const search = requests[index]
      
      if (search.dealership === 'cpfl') {
        await cpflController.runUpdateTimeRoutine(search.state, search.city)
      } else if (search.dealership === 'equatorial') {
        await equatorialController.updateTime(search.state, search.city)
      } else if (search.dealership === 'energisa') {
        await energisaController.updateTime(search.state, search.city)
      }
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

    for (let index = 0; index < requests.length; index++) {
      const search = requests[index]
      
      await cpflController.runCpflRoutine(browser, search.state, search.city)
        .catch(error => console.log(error))
      await equatorialController.runRoutine(browser, search.state, search.city)
        .catch(error => console.log(error))
      await energisaController.runRoutine(search.state, search.city)
        .catch(error => console.log(error))
    }

    for (let index = 0; index < requests.length; index++) {
      const search = requests[index]

      await cpflSearchNowRepository.delete({
        state: search.state,
        city: search.city
      })
    }

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
    .catch(error => console.log(error))
  await equatorialController.deleteAllDataWithStatusFinished()
    .catch(error => console.log(error))
  await energisaController.deleteAllDataWithStatusFinished()
    .catch(error => console.log(error))

  console.log(`${FgBlue}%s${Reset}`, `
    ENERGY --> Rotina para deletar todos os serviços que foram finalizados (status 4)\n
    ENERGY --> final da execução: ${moment().subtract(3, 'hours').format('YYYY-MM-DD HH:mm:ss')}
    `)
}

async function getEnergisaInformations() {
  await energisaController.getCitiesAvailable()
}

export default async () => {
  const fifteenMinutesBrowser = await cpflController.runBrowser()
  const thirtyMinutesBrowser = await cpflController.runBrowser()
  const fortyFiveMinutesBrowser = await cpflController.runBrowser()
  const sixtyMinutesBrowser = await cpflController.runBrowser()

  const twoHoursBrowser = await cpflController.runBrowser()
  const threeHoursBrowser = await cpflController.runBrowser()
  const fiveHoursBrowser = await cpflController.runBrowser()

  const serviceAddedBrowser = await cpflController.runBrowser()

  const fifteenRoutine = new CronJob.CronJob('*/15 * * * *', async () => {
    await cpflRoutine(fifteenMinutesBrowser, 15)
    await equatorialRoutine(fifteenMinutesBrowser, 15)
    await energisaRoutine(15)
  })
  
  const thirtyRoutine = new CronJob.CronJob('*/30 * * * *', async () => {
    await cpflRoutine(thirtyMinutesBrowser, 30)
    await equatorialRoutine(thirtyMinutesBrowser, 30)
    await energisaRoutine(30)
  })
  
  const fortyFiveRoutine = new CronJob.CronJob('*/45 * * * *', async () => {
    await cpflRoutine(fortyFiveMinutesBrowser, 45)
    await equatorialRoutine(fortyFiveMinutesBrowser, 45)
    await energisaRoutine(30)
  })
  
  const sixtyRoutine = new CronJob.CronJob('*/60 * * * *', async () => {
    await cpflRoutine(sixtyMinutesBrowser, 60)
    await equatorialRoutine(sixtyMinutesBrowser, 60)
    await energisaRoutine(60)
  })
  
  const twoHoursRoutine = new CronJob.CronJob('0 */2 * * *', async () => {
    await cpflRoutine(twoHoursBrowser, 120)
    await equatorialRoutine(twoHoursBrowser, 120)
    await energisaRoutine(120)
  })
  
  const threeHoursRoutine = new CronJob.CronJob('0 */3 * * *', async () => {
    await cpflRoutine(threeHoursBrowser, 180)
    await equatorialRoutine(threeHoursBrowser, 180)
    await energisaRoutine(180)
  })
  
  const fiveHoursRoutine = new CronJob.CronJob('0 */5 * * *', async () => {
    await cpflRoutine(fiveHoursBrowser, 300)
    await equatorialRoutine(fiveHoursBrowser, 300)
    await energisaRoutine(300)
  })

  // auxiliar routines
  const updateTimeRoutine = new CronJob.CronJob('* * * * *', async () => {
    await updateRoutine()
  })

  const updateServicesAddedRoutine = new CronJob.CronJob('*/10 * * * *', async () => {
    await updateServicesAdded(serviceAddedBrowser)
  })

  const deleteDataWithStatusFinishedRoutine = new CronJob.CronJob('15 0 * * *', async () => {
    await deleteDataWithStatusFinished()
  })

  const getEnergisaInformationsRoutine = new CronJob.CronJob('*/10 * * * *', async () => {
    await getEnergisaInformations()
  })

  fifteenRoutine.start()
  thirtyRoutine.start()
  fortyFiveRoutine.start()
  sixtyRoutine.start()
  twoHoursRoutine.start()
  threeHoursRoutine.start()
  fiveHoursRoutine.start()

  updateServicesAddedRoutine.start()
  
  updateTimeRoutine.start()
  deleteDataWithStatusFinishedRoutine.start()

  getEnergisaInformationsRoutine.start()
}