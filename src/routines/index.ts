import { Server } from 'socket.io'
import puppeteer from 'puppeteer'
import CronJob from 'cron'
import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'

import routinesRequests from './downDetectorRoutines'

dotenv.config()

const processName = process.env.name || 'primary'

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

  // console.log(chromeTmpDataDir)
  fs.rmSync(chromeTmpDataDir, { recursive: true, force: true })
  // console.log(chromeTmpDataDir)
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

      closeBrowser(browser)
    })
    
    const ThreeMinutesJob = new CronJob.CronJob('*/3 * * * * ', async () => {
      const browser = await runBrowser()
      
      await routinesRequests(serverIo, browser, 3)

      closeBrowser(browser)
    })
    
    const FiveMinutesJob = new CronJob.CronJob('*/5 * * * * ', async () => {
      const browser = await runBrowser()
      
      await routinesRequests(serverIo, browser, 5)

      closeBrowser(browser)
    })
    
    const TeenMinutesJob = new CronJob.CronJob('*/10 * * * * ', async () => {
      const browser = await runBrowser()
      
      await routinesRequests(serverIo, browser, 10)

      closeBrowser(browser)
    })
    
    const FifteenMinutesJob = new CronJob.CronJob('*/15 * * * * ', async () => {
      const browser = await runBrowser()
      
      await routinesRequests(serverIo, browser, 15)

      closeBrowser(browser)
    })

    const cleanTemporaryFilesRoutine = new CronJob.CronJob('*/2 * * * * ', async () => {
      const isLinux = process.platform === 'darwin' || process.platform === 'linux'

      if (isLinux) {
        let filesList = fs.readdirSync('/tmp')
        
        filesList.forEach((file) => {
          const isTemporaryFileOfPuppeteer = file.includes('puppeteer_dev_chrome_profile-')

          console.log(file)
          console.log(isTemporaryFileOfPuppeteer)

          if (isTemporaryFileOfPuppeteer) {
            fs.rmSync(file, { recursive: true, force: true })
          }
        })
      }
    })

    oneMinuteJob.start()
    ThreeMinutesJob.start()
    FiveMinutesJob.start()
    TeenMinutesJob.start()
    FifteenMinutesJob.start()

    cleanTemporaryFilesRoutine.start()
  }
}