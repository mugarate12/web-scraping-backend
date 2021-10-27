import { Server } from 'socket.io'
import puppeteer from 'puppeteer'

import { servicesController } from './../controllers'
import { servicesRepository } from './../repositories'
import oneMinuteRoutinesRequests from './oneMinuteRoutines'

import { pageInstanceInterface } from './../interfaces/routines'

async function runBrowser() {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'], slowMo: 200 })
  return browser
}

function verifyExistsInstance(instancesArray: Array<pageInstanceInterface>, serviceName: string) {
  let haveInstance = false

  instancesArray.forEach((instance) => {
    if (instance.serviceName === serviceName) {
      haveInstance = true
    }
  })

  return haveInstance
}

async function createPages(time: number, instancesArray: Array<pageInstanceInterface>, browser: puppeteer.Browser) {
  const requests = await servicesRepository.index({ update_time: time })
    .then(services => services)
    .catch(error => console.log('error', error))

  if (!!requests) {
    requests.forEach(async (request) => {
      const exists = verifyExistsInstance(instancesArray, request.service_name)

      if (!exists) {
        const page = await browser.newPage()

        instancesArray.push({
          serviceName: request.service_name,
          pageInstance: page
        })
      }
    })
  }
}

export function convertMinutesToMilliseconds(minutes: number) {
  const oneMinuteInMilliseconds = 60000

  return oneMinuteInMilliseconds * minutes
}

async function sleep(milliseconds: number) {
  return new Promise(resolve => setTimeout(resolve, milliseconds))
}

let runOneMinuteRoutines = true

// rotinas de um minuto
export async function oneMinuteRoutines(serverIo: Server, browser: puppeteer.Browser) {
  if (runOneMinuteRoutines) {
    runOneMinuteRoutines = false

    await oneMinuteRoutinesRequests(serverIo, browser)
  
    await sleep(convertMinutesToMilliseconds(1))

    runOneMinuteRoutines = true
  }
}

export default async (serverIo: Server) => {
  const browser = await runBrowser()

  // será um array pra cada margem de tempo
  // const oneMinuteRoutineArray: Array<pageInstanceInterface> = []

  // setInterval(() => {
  //   createPages(1, oneMinuteRoutineArray, browser)
  // }, 5000)

  setInterval(() => {
    oneMinuteRoutines(serverIo, browser)
  }, 5000)
}