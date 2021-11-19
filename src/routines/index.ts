import { Server } from 'socket.io'
import puppeteer from 'puppeteer'
import CronJob from 'cron'

import routinesRequests from './downDetectorRoutines'

import {
  downDetectorRoutineExecutionRepository
} from './../repositories'

let runOneMinuteRoutines = true
let runThreeMinutesRoutines = true
let runFiveMinutesRoutines = true
let runTeenMinutesRoutines = true
let runFifteenMinutesRoutines = true

async function runBrowser() {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'], slowMo: 200 })
  return browser
}

export function convertMinutesToMilliseconds(minutes: number) {
  const oneMinuteInMilliseconds = 60000

  return oneMinuteInMilliseconds * minutes
}

async function sleep(milliseconds: number) {
  return new Promise(resolve => setTimeout(resolve, milliseconds))
}

// rotina de um minuto
export async function oneMinuteRoutines(serverIo: Server, browser: puppeteer.Browser) {
  if (runOneMinuteRoutines) {
    runOneMinuteRoutines = false
    
    await routinesRequests(serverIo, browser, 1)
    
    await sleep(convertMinutesToMilliseconds(1))
    
    runOneMinuteRoutines = true
  }
}

// rotina de três minutos
export async function threeMinuteRoutines(serverIo: Server, browser: puppeteer.Browser) {
  if (runThreeMinutesRoutines) {
    runThreeMinutesRoutines = false

    await sleep(convertMinutesToMilliseconds(3))
    
    await routinesRequests(serverIo, browser, 3)

    runThreeMinutesRoutines = true
  }
}

// rotina de cinco minutos
export async function fiveMinuteRoutines(serverIo: Server, browser: puppeteer.Browser) {
  if (runFiveMinutesRoutines) {
    runFiveMinutesRoutines = false

    await sleep(convertMinutesToMilliseconds(5))
    
    await routinesRequests(serverIo, browser, 5)

    runFiveMinutesRoutines = true
  }
}

// rotina de dez minutos
export async function teenMinuteRoutines(serverIo: Server, browser: puppeteer.Browser) {
  if (runTeenMinutesRoutines) {
    runTeenMinutesRoutines = false

    await sleep(convertMinutesToMilliseconds(10))
    
    await routinesRequests(serverIo, browser, 10)

    runTeenMinutesRoutines = true
  }
}

// rotina de quinze minutos
export async function fifteenMinuteRoutines(serverIo: Server, browser: puppeteer.Browser) {
  if (runFifteenMinutesRoutines) {
    runFifteenMinutesRoutines = false

    await sleep(convertMinutesToMilliseconds(15))
    
    await routinesRequests(serverIo, browser, 15)

    runFifteenMinutesRoutines = true
  }
}


export default async (serverIo: Server) => {
  const browser = await runBrowser()
  
  const oneMinuteJob = new CronJob.CronJob('* * * * * ', async () => {
    await routinesRequests(serverIo, browser, 1)
  })

  const ThreeMinutesJob = new CronJob.CronJob('*/3 * * * * ', async () => {
    await routinesRequests(serverIo, browser, 3)
  })
  
  const FiveMinutesJob = new CronJob.CronJob('*/5 * * * * ', async () => {
    await routinesRequests(serverIo, browser, 5)
  })
  
  const TeenMinutesJob = new CronJob.CronJob('*/10 * * * * ', async () => {
    await routinesRequests(serverIo, browser, 10)
  })
  
  const FifteenMinutesJob = new CronJob.CronJob('*/15 * * * * ', async () => {
    await routinesRequests(serverIo, browser, 15)
  })

  oneMinuteJob.start()
  ThreeMinutesJob.start()
  FiveMinutesJob.start()
  TeenMinutesJob.start()
  FifteenMinutesJob.start()
  // await downDetectorRoutineExecutionRepository.update(1, 1)
  // await downDetectorRoutineExecutionRepository.update(3, 1)
  // await downDetectorRoutineExecutionRepository.update(5, 1)
  // await downDetectorRoutineExecutionRepository.update(10, 1)
  // await downDetectorRoutineExecutionRepository.update(15, 1)

  // console.log('ok');
}