import { Server } from 'socket.io'
import puppeteer from 'puppeteer'
import CronJob from 'cron'

import routinesRequests from './downDetectorRoutines'

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
  await routinesRequests(serverIo, browser, 1)
  // if (runOneMinuteRoutines) {
  //   runOneMinuteRoutines = false

  //   await sleep(convertMinutesToMilliseconds(1))
    

  //   runOneMinuteRoutines = true
  // }
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

  oneMinuteJob.start()


  // setInterval(() => {
  //   oneMinuteRoutines(serverIo, browser)
  //   threeMinuteRoutines(serverIo, browser)
  //   fiveMinuteRoutines(serverIo, browser)
  //   teenMinuteRoutines(serverIo, browser)
  //   fifteenMinuteRoutines(serverIo, browser)
  // }, 5000)
}