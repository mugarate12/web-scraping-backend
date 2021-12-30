import { Server } from 'socket.io'
import puppeteer from 'puppeteer'
import CronJob from 'cron'
import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'

import routinesRequests from './downDetectorRoutines'
import cleanTemporaryFilesRoutine from './cleanTemporaryFilesRoutine'
import CPFLRoutine from './CPFLRoutine'

dotenv.config()

const processName = process.env.name || 'primary'

export function convertMinutesToMilliseconds(minutes: number) {
  const oneMinuteInMilliseconds = 60000

  return oneMinuteInMilliseconds * minutes
}

function cleanTemporaryFiles() {
  const isLinux = process.platform === 'darwin' || process.platform === 'linux'

  if (isLinux) {
    let filesList = fs.readdirSync('/tmp')
    // console.log(filesList)
    
    filesList.forEach((file) => {
      const isTemporaryFileOfPuppeteer = file.includes('puppeteer_dev_chrome_profile-')
      const isTemporaryFileOfChromium = file.includes('.org.chromium.Chromium.')

      // console.log('if: ', isTemporaryFileOfPuppeteer || isTemporaryFileOfChromium, 'file: ', file)

      if (isTemporaryFileOfPuppeteer || isTemporaryFileOfChromium) {
        fs.rmSync(file, { recursive: true, force: true })
      }
    })

    console.log('arquivos temporários excluídos com sucesso!')
  }
}

async function sleep(milliseconds: number) {
  return new Promise(resolve => setTimeout(resolve, milliseconds))
}

export default async (serverIo: Server) => {
  if(processName.search(/primary/) !== -1){
    cleanTemporaryFilesRoutine()

    routinesRequests(serverIo)

    CPFLRoutine()
  }
}