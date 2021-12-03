import { Server } from 'socket.io'
import puppeteer from 'puppeteer'
import CronJob from 'cron'
import dotenv from 'dotenv'

import routinesRequests from './downDetectorRoutines'

dotenv.config()

const processName = process.env.name || 'primary'

async function runBrowser() {
  const minimal_args = [
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

  const browser = await puppeteer.launch({ headless: true, args: minimal_args })
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
    // const browserOneMinuteJob = await runBrowser()
    // const browserThreeMinuteJob = await runBrowser()
    // const browserFiveMinuteJob = await runBrowser()
    // const browserTeenMinuteJob = await runBrowser()
    // const browserFifteenMinuteJob = await runBrowser()
    
    const oneMinuteJob = new CronJob.CronJob('* * * * * ', async () => {
      const browser = await runBrowser()
      
      await routinesRequests(serverIo, browser, 1)

      await browser.close()
    })
    
    const ThreeMinutesJob = new CronJob.CronJob('*/3 * * * * ', async () => {
      const browser = await runBrowser()
      
      await routinesRequests(serverIo, browser, 3)

      await browser.close()
    })
    
    const FiveMinutesJob = new CronJob.CronJob('*/5 * * * * ', async () => {
      const browser = await runBrowser()
      
      await routinesRequests(serverIo, browser, 5)

      await browser.close()
    })
    
    const TeenMinutesJob = new CronJob.CronJob('*/10 * * * * ', async () => {
      const browser = await runBrowser()
      
      await routinesRequests(serverIo, browser, 10)

      await browser.close()
    })
    
    const FifteenMinutesJob = new CronJob.CronJob('*/15 * * * * ', async () => {
      const browser = await runBrowser()
      
      await routinesRequests(serverIo, browser, 15)

      await browser.close()
    })

    oneMinuteJob.start()
    ThreeMinutesJob.start()
    FiveMinutesJob.start()
    TeenMinutesJob.start()
    FifteenMinutesJob.start()
  }
}