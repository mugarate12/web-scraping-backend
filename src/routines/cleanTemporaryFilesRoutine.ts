import CronJob from 'cron'
import fs from 'fs'

export function cleanTemporaryFiles() {
  const isLinux = process.platform === 'darwin' || process.platform === 'linux'

  if (isLinux) {
    let filesList = fs.readdirSync('/tmp')
    // console.log(filesList)
    
    filesList.forEach((file) => {
      const isTemporaryFileOfPuppeteer = file.includes('puppeteer_dev_chrome_profile-')
      const isTemporaryFileOfChromium = file.includes('.org.chromium.Chromium.')

      console.log('if: ', isTemporaryFileOfPuppeteer || isTemporaryFileOfChromium, 'file: ', file)

      if (isTemporaryFileOfPuppeteer || isTemporaryFileOfChromium) {
        fs.rmSync(`/tmp/${file}`, { recursive: true, force: true })
      }
    })

    console.log(`
      TEMPORARY FILES --> rotina de exclusão de arquivos temporários concluída !
    `)
  }
}

export default () => {
  const cleanTemporaryFilesRoutine = new CronJob.CronJob('*/2 * * * * ', cleanTemporaryFiles)

  cleanTemporaryFilesRoutine.start()
}