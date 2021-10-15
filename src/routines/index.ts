import { Server } from 'socket.io'

import oneMinuteRoutinesRequests from './oneMinuteRoutines'

export function convertMinutesToMilliseconds(minutes: number) {
  const oneMinuteInMilliseconds = 60000

  return oneMinuteInMilliseconds * minutes
}

async function sleep(milliseconds: number) {
  return new Promise(resolve => setTimeout(resolve, milliseconds))
}

let runOneMinuteRoutines = true

// rotinas de um minuto
export async function oneMinuteRoutines(serverIo: Server) {
  if (runOneMinuteRoutines) {
    runOneMinuteRoutines = false

    await oneMinuteRoutinesRequests(serverIo)
  
    await sleep(convertMinutesToMilliseconds(2))

    runOneMinuteRoutines = true
  }
}

export default (serverIo: Server) => {
  setInterval(() => {
    oneMinuteRoutines(serverIo)
  }, 5000)
}