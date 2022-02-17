import { Server } from 'socket.io'
import dotenv from 'dotenv'

import cleanTemporaryFilesRoutine, { cleanTemporaryFiles } from './cleanTemporaryFilesRoutine'
import clientKeysExpirationRoutine from './clientKeysExpirationRoutine'
import CPFLRoutine from './CPFLRoutine'
import routinesRequests from './downDetectorRoutines'
import ocrRoutine from './ocrRoutine'
import nfeFazendaRoutine from './nfeFazendaRoutine'

dotenv.config()

const processName = process.env.name || 'primary'

export function convertMinutesToMilliseconds(minutes: number) {
  const oneMinuteInMilliseconds = 60000

  return oneMinuteInMilliseconds * minutes
}

export default async (serverIo: Server) => {
  if(processName.search(/primary/) !== -1){
    // cleanTemporaryFilesRoutine()
    try {
      cleanTemporaryFiles()
    } catch (error) {
      console.log(error)
    }

    clientKeysExpirationRoutine()
    
    routinesRequests(serverIo)
    CPFLRoutine()
    nfeFazendaRoutine()
    ocrRoutine()
  }
}