import { Server } from 'socket.io'
import puppeteer from 'puppeteer'
import CronJob from 'cron'
import dotenv from 'dotenv'

import routinesRequests from './downDetectorRoutines'

dotenv.config()

const processName = process.env.name || 'primary'

async function runBrowser() {
  const browser = await puppeteer.launch({ headless: false, args: ['--no-sandbox'], slowMo: 200 })
  return browser
}

export function convertMinutesToMilliseconds(minutes: number) {
  const oneMinuteInMilliseconds = 60000

  return oneMinuteInMilliseconds * minutes
}

async function sleep(milliseconds: number) {
  return new Promise(resolve => setTimeout(resolve, milliseconds))
}

export default async (serverIo: Server) => {
  if(processName.search(/primary/) !== -1){
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
  }
  // await downDetectorRoutineExecutionRepository.update(1, 1)
  // await downDetectorRoutineExecutionRepository.update(3, 1)
  // await downDetectorRoutineExecutionRepository.update(5, 1)
  // await downDetectorRoutineExecutionRepository.update(10, 1)
  // await downDetectorRoutineExecutionRepository.update(15, 1)

  // console.log('ok');
}