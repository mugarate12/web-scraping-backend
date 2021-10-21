import { Request, Response } from 'express'
import puppeteer from 'puppeteer'

export default class DownDetectorController {
  private url = 'https://downdetector.com/status/facebook/'

  private makeUrl = (service: string) => {
    const url = `https://downdetector.com/status/${service}`

    return url
  }

  private sleep = (milliseconds: number) => {
    return new Promise(resolve => setTimeout(resolve, milliseconds))
  }

  public accessDownDetector = async (req: Request, res: Response) => {
    const { serviceName } = req.params
    
    const browser = await puppeteer.launch({ 
      headless: true,
      slowMo: 200
    })
    const page = await browser.newPage()

    await page.setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.108 Safari/537.36')

    // await page.setDefaultTimeout(2000)
    await page.setDefaultNavigationTimeout(0)
    
    await page.goto(this.makeUrl(serviceName))
      // .then(async (response) => {
      //   console.log('status', response.status())
      //   console.log('status text', response.statusText())
      //   // const text = await response.text()
      //   // console.log('response body text', text)
      // })

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

    await browser.close()

    return res.json({ result })
    // return res.json({})
  }

  public accessDownDetectorRoutine = async (serviceName: string) => {
    const url = this.makeUrl(serviceName)
    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'], slowMo: 200 })
    const page = await browser.newPage()

    await page.setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.108 Safari/537.36')

    await page.setDefaultNavigationTimeout(0)
    await page.goto(url)

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
        name: title.split(' ')[title.split('').length - 1], 
        url,
        title,
        status,
        baseline,
        reports
      }
    })

    console.log(`${serviceName} status: ${result.status}`)

    await browser.close()

    return result
  }
}