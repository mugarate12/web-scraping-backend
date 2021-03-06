import { Server } from 'socket.io'
import puppeteer from 'puppeteer'
import moment from 'moment'
import Redis from 'promise-redis'
import dotenv from 'dotenv'
import CronJob from 'cron'
import fs from 'fs'

dotenv.config()

import {
  downDetectorController
} from './../controllers'

import {
  downDetectorRoutineExecutionRepository,
  monitoringRepository,
  servicesRepository
} from './../repositories'

import { serviceInterface } from './../repositories/servicesRepository'

import { FgYellow, Reset } from './../utils/colorsInTerminalReference'

import { downDetectorChangeInterface } from './../repositories/downDetectorChangeRepository'
import { downDetectorHistInterface } from './../repositories/downDetectorHistRepository'
import { downDetectorSearchResult } from './../interfaces/downDetector'

const colorToLog = `${FgYellow}%s${Reset}`
const redis = Redis()
const client = redis.createClient()

client.on("error", (error) => {
  console.error(error);
})

async function runBrowser() {
  const minimal_args = [
    '--incognito',

    '--autoplay-policy=user-gesture-required',
    '--disable-background-networking',
    '--disable-background-timer-throttling',
    '--disable-backgrounding-occluded-windows',
    '--disable-breakpad',
    '--disable-client-side-phishing-detection',
    '--disable-component-update',
    '--disable-default-apps',
    '--disable-dev-shm-usage',
    '--disable-domain-reliability',
    '--disable-extensions',
    '--disable-features=AudioServiceOutOfProcess',
    '--disable-hang-monitor',
    '--disable-ipc-flooding-protection',
    '--disable-notifications',
    '--disable-offer-store-unmasked-wallet-cards',
    '--disable-popup-blocking',
    '--disable-print-preview',
    '--disable-prompt-on-repost',
    '--disable-renderer-backgrounding',
    '--disable-setuid-sandbox',
    '--disable-speech-api',
    '--disable-sync',
    '--hide-scrollbars',
    '--ignore-gpu-blacklist',
    '--metrics-recording-only',
    '--mute-audio',
    '--no-default-browser-check',
    '--no-first-run',
    '--no-pings',
    '--no-sandbox',
    '--no-zygote',
    '--password-store=basic',
    '--use-gl=swiftshader',
    '--use-mock-keychain',
  ]

  const browser = await puppeteer.launch({ 
    headless: true, 
    args: minimal_args,
    // userDataDir: false
  })
  
  return browser
}

async function closeBrowser(browser: puppeteer.Browser) {
  let chromeTmpDataDir: string = ''

  let chromeSpawnArgs = browser.process()?.spawnargs

  if (!!chromeSpawnArgs) {
    for (let i = 0; i < chromeSpawnArgs.length; i++) {
      if (chromeSpawnArgs[i].indexOf("--user-data-dir=") === 0) {
          chromeTmpDataDir = chromeSpawnArgs[i].replace("--user-data-dir=", "");
      }
    }
  }

  await browser.close()

  fs.rmSync(chromeTmpDataDir, { recursive: true, force: true })
}

function initialRoutineLog(totalOfServices: number, updateTime: number) {
  console.log(colorToLog, `
    Detector --> Requisitando servi??os de update em ${updateTime} minuto(s)\n
    Detector --> Requisitando ${totalOfServices} servi??os\n
    Detector --> come??o da execu????o: ${moment().subtract(3, 'hours').format('YYYY-MM-DD HH:mm:ss')}
  `)
}

function headquarterInitialLog(updateTime: number, indicator: number, totalOfSteps: number) {
  console.log(colorToLog, `
    Detector --> parte ${indicator} de ${totalOfSteps} da rotina de ${updateTime} minuto(s) iniciada
  `)
}

function headquarterCompleteLog(updateTime: number, indicator: number, totalOfSteps: number) {
  console.log(colorToLog, `
    Detector --> parte ${indicator} de ${totalOfSteps} da rotina de ${updateTime} minuto(s) finalizada
  `)
}

function finalRoutineLog(updateTime: number) {
  console.log(colorToLog, `
      Detector --> Final da execu????o: ${moment().subtract(3, 'hours').format('YYYY-MM-DD HH:mm:ss')}\n
      Detector --> Requisi????es da rotina de ${updateTime} minuto(s) finalizadas\n
  `)
}

async function viewAndSetRedisKey(updateTime: number) {
  const completeRedisKey = `finished_routine_${updateTime}`

  const completeKeyStatus = await client.get(completeRedisKey)

  if (Number(completeKeyStatus) === 2) {
    return true
  } else {
    await client.set(completeRedisKey, 2)
    await client.expire(completeRedisKey, 240)

    return false
  }
}

async function setRedisKeyToComplete(updateTime: number) {
  const completeRedisKey = `finished_routine_${updateTime}`

  await client.set(completeRedisKey, 1)
}

function setParticularLastExecution(updateTime: number, beforeLastExecution: string) {
  let timing = beforeLastExecution

  if (updateTime === 1) {
    timing = moment().seconds(0).format('YYYY-MM-DD HH:mm:ss')
  }

  return timing
}

function createHeadquartersOfServices(requests: serviceInterface[]) {
  let result: Array<serviceInterface[]> = []
  let headquarter: serviceInterface[] = []

  requests.forEach((request, index) => {
    const haveTeenElements = (index + 1) % 10 === 0
    const isFinalOfRequests = (index + 1) === requests.length
    
    if (haveTeenElements || isFinalOfRequests) {
      headquarter.push(request)
      result.push(headquarter)

      headquarter = []
    } else {
      headquarter.push(request)
    }
  })

  return result
}

async function routinesRequests(serverIo: Server, browser: puppeteer.Browser, updateTime: number) {  
  const requests = await servicesRepository.index({ update_time: updateTime, habilitado: 1 })
    .then(services => services)
    .catch(error => console.log('error', error))
  
  let lastExecution = moment().format('YYYY-MM-DD HH:mm:ss')

  if (!!requests && requests.length > 0) {
    const redisResponse = await viewAndSetRedisKey(updateTime)
    if (redisResponse) {
      return
    }
    
    initialRoutineLog(requests.length, updateTime)

    await downDetectorController.emitExecutionRoutine(serverIo, updateTime)
    const headquartersOFRequests = createHeadquartersOfServices(requests)

    for (let index = 0; index < headquartersOFRequests.length; index++) {
      const requestsOfHeadquarter = headquartersOFRequests[index]
      
      headquarterInitialLog(updateTime, index + 1, headquartersOFRequests.length)
      
      const requestsResultsPromises = requestsOfHeadquarter.map(async (request, index) => {
        await downDetectorController.accessDownDetectorRoutine(request.service_name, browser)
          .catch(error => {
            console.log('error em: ', request.service_name)
            console.log(error)
            return undefined
          })
      })

      await Promise.all([ ...requestsResultsPromises ])
      headquarterCompleteLog(updateTime, index + 1, headquartersOFRequests.length)
    }
    
    setRedisKeyToComplete(updateTime)
    
    finalRoutineLog(updateTime)
  }

  lastExecution = setParticularLastExecution(updateTime, lastExecution)
  
  await downDetectorController.createOrUpdateServiceUpdateTime(updateTime, lastExecution)
  await downDetectorController.emitUpdateTime(serverIo)

  await downDetectorRoutineExecutionRepository.update(updateTime, 1)
}

export default async (serverIo: Server) => {
  const oneMinuteBrowser = await runBrowser()
  const threeMinutesBrowser = await runBrowser()
  const fiveMinutesBrowser = await runBrowser()
  const teenMinutesBrowser = await runBrowser()
  const fifteenMinutesBrowser = await runBrowser()

  const oneMinuteJob = new CronJob.CronJob('* * * * * ', async () => {    
    await routinesRequests(serverIo, oneMinuteBrowser, 1)
  })

  const ThreeMinutesJob = new CronJob.CronJob('*/3 * * * * ', async () => {    
    await routinesRequests(serverIo, threeMinutesBrowser, 3)
  })

  const FiveMinutesJob = new CronJob.CronJob('*/5 * * * * ', async () => {    
    await routinesRequests(serverIo, fiveMinutesBrowser, 5)
  })

  const TeenMinutesJob = new CronJob.CronJob('*/10 * * * * ', async () => {    
    await routinesRequests(serverIo, teenMinutesBrowser, 10)
  })

  const FifteenMinutesJob = new CronJob.CronJob('*/15 * * * * ', async () => {    
    await routinesRequests(serverIo, fifteenMinutesBrowser, 15)
  })

  await setRedisKeyToComplete(1)
  await setRedisKeyToComplete(3)
  await setRedisKeyToComplete(5)
  await setRedisKeyToComplete(10)
  await setRedisKeyToComplete(15)

  oneMinuteJob.start()
  ThreeMinutesJob.start()
  FiveMinutesJob.start()
  TeenMinutesJob.start()
  FifteenMinutesJob.start()
}