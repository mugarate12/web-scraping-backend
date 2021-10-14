import { downDetectorController } from './../controllers'

export function convertMinutesToMilliseconds(minutes: number) {
  const oneMinuteInMilliseconds = 60000

  return oneMinuteInMilliseconds * minutes
}

async function sleep(milliseconds: number) {
  return new Promise(resolve => setTimeout(resolve, milliseconds))
}

let runOneMinuteRoutines = true

// rotinas de um minuto
export async function oneMinuteRoutines() {
  if (runOneMinuteRoutines) {
    runOneMinuteRoutines = false

    console.log('facebook routine')
    await downDetectorController.accessDownDetectorRoutine('facebook')
    console.log('instagram routine')
    await downDetectorController.accessDownDetectorRoutine('instagram')
  
    await sleep(convertMinutesToMilliseconds(3))

    runOneMinuteRoutines = true
  }
}

export default () => {
  setInterval(() => {
    oneMinuteRoutines()
  }, 5000)
}