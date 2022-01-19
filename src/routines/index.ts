import { Server } from 'socket.io'
import puppeteer from 'puppeteer'
import CronJob from 'cron'
import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'

import cleanTemporaryFilesRoutine from './cleanTemporaryFilesRoutine'
import clientKeysExpirationRoutine from './clientKeysExpirationRoutine'
import CPFLRoutine from './CPFLRoutine'
import routinesRequests from './downDetectorRoutines'
import ocrRoutine from './ocrRoutine'


dotenv.config()

const processName = process.env.name || 'primary'

export function convertMinutesToMilliseconds(minutes: number) {
  const oneMinuteInMilliseconds = 60000

  return oneMinuteInMilliseconds * minutes
}

export default async (serverIo: Server) => {
  if(processName.search(/primary/) !== -1){
    cleanTemporaryFilesRoutine()
    clientKeysExpirationRoutine()
    
    routinesRequests(serverIo)
    CPFLRoutine()
    ocrRoutine()
  }
}