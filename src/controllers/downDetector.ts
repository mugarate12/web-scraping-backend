import { Request, Response } from 'express'
import puppeteer from 'puppeteer'

export default class DownDetectorController {
  private url = 'https://downdetector.com/status/facebook/'

  private makeUrl = (service: string) => {
    const url = `https://downdetector.com/status/${service}`

    return url
  }

  public accessDownDetector = async (req: Request, res: Response) => {
    const { serviceName } = req.params
    
    const browser = await puppeteer.launch({ headless: false })
    const page = await browser.newPage()

    await page.setDefaultNavigationTimeout(0)
    await page.goto(this.makeUrl(serviceName))

    const result = await page.evaluate(() => {
      const titleElement = document.getElementsByClassName('entry-title')[0]
      const titleTextContent = String(titleElement.textContent)
      
      // get title
      const firstLetter = titleTextContent.indexOf('User')
      const textSlicedToFirstLetter = titleTextContent.slice(firstLetter, titleTextContent.length)
      const title = textSlicedToFirstLetter.slice(0, textSlicedToFirstLetter.indexOf('\n'))

      const currentServiceProperties = window['DD']['currentServiceProperties']
      const status = currentServiceProperties['status']
      const series = currentServiceProperties['series']
      const baseline = series['baseline']['data']
      const reports = series['reports']['data']

      return {
        title,
        status,
        baseline,
        reports
      }
    })

    // await page.screenshot({ path: 'downfacebook.png' })

    await browser.close()

    return res.json({ result })
  }
}