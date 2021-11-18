import { Request, Response } from 'express'
import puppeteer from 'puppeteer'
import moment from 'moment'
import { Server } from 'socket.io'

import { downDetectorData } from './../interfaces/downDetector'
import {
  downDetectorChangeRepository,
  downDetectorHistRepository,
  servicesUpdateTimeRepository
} from './../repositories'

import { downDetectorChangeInterface } from './../repositories/downDetectorChangeRepository'
import { downDetectorSearchResult } from './../interfaces/downDetector'

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

    await page.setDefaultNavigationTimeout(0)
    
    await page.goto(this.makeUrl(serviceName))
      .catch(error => {
        console.log(error)
      })

    const result = await page.evaluate(() => {
      const titleElement = document.getElementsByClassName('entry-title')[0]
      const titleTextContent = String(titleElement.textContent)
      
      // get title
      const firstLetter = titleTextContent.indexOf('User')
      const textSlicedToFirstLetter = titleTextContent.slice(firstLetter, titleTextContent.length)
      const title = textSlicedToFirstLetter.slice(0, textSlicedToFirstLetter.indexOf('\n'))

      const currentServiceProperties = window['DD']['currentServiceProperties']
      const status: string = currentServiceProperties['status']
      const series = currentServiceProperties['series']
      const baseline: Array<downDetectorData> = series['baseline']['data']
      const reports: Array<downDetectorData> = series['reports']['data']

      return {
        title,
        status,
        baseline,
        reports
      }
    })

    await browser.close()

    return res.json({ result })
  }

  public accessDownDetectorRoutine = async (serviceName: string, browser: puppeteer.Browser) => {
    const url = this.makeUrl(serviceName)

    const pageInstance = await browser.newPage()
    await pageInstance.setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.108 Safari/537.36')

    await pageInstance.setDefaultNavigationTimeout(0)
    await pageInstance.goto(url)

    const data = await pageInstance.evaluate(() => {
      const titleElement = document.getElementsByClassName('entry-title')[0]
      const titleTextContent = String(titleElement.textContent)
      
      // get title
      const firstLetter = titleTextContent.indexOf('User')
      const textSlicedToFirstLetter = titleTextContent.slice(firstLetter, titleTextContent.length)
      const title = textSlicedToFirstLetter.slice(0, textSlicedToFirstLetter.indexOf('\n'))

      const currentServiceProperties = window['DD']['currentServiceProperties']
      const status: string = currentServiceProperties['status']
      const series = currentServiceProperties['series']
      const baseline: Array<downDetectorData> = series['baseline']['data']
      const reports: Array<downDetectorData> = series['reports']['data']

      return {
        name: title.split(' ')[title.split('').length - 1],
        title,
        status,
        baseline,
        reports
      }
    })

    const result: downDetectorSearchResult = {
      url,
      ...data
    }

    console.log(`${serviceName} status: ${data.status}`)

    pageInstance.close()

    return result
  }

  private changeStringStatusToInteger = (status: string) => {
    if (status === 'success') {
      return 3
    } else if (status === 'danger') {
      return 2
    } else {
      return 1
    }
  }

  private createChangeInteger = (lastRegistryOfChange: downDetectorChangeInterface[], downDetectorResult: downDetectorSearchResult) => {
    if (!lastRegistryOfChange[0]) {
      return 0
    }

    if (lastRegistryOfChange[0].status_atual === 3 && this.changeStringStatusToInteger(downDetectorResult.status) === 2) {
      return 1
    } else if (lastRegistryOfChange[0].status_atual === 3 && this.changeStringStatusToInteger(downDetectorResult.status) === 1) {
      return 2
    } else if (lastRegistryOfChange[0].status_atual === 2 && this.changeStringStatusToInteger(downDetectorResult.status) === 3) {
      return 3
    } else if (lastRegistryOfChange[0].status_atual === 2 && this.changeStringStatusToInteger(downDetectorResult.status) === 1) {
      return 4
    } else if (lastRegistryOfChange[0].status_atual === 1 && this.changeStringStatusToInteger(downDetectorResult.status) === 3) {
      return 5
    } else if (lastRegistryOfChange[0].status_atual === 1 && this.changeStringStatusToInteger(downDetectorResult.status) === 2) {
      return 6
    } else {
      return 0
    }
  }

  public updateChangeHistory = async (downDetectorResult: downDetectorSearchResult) => {
    const lastRegistryOfChange = await downDetectorChangeRepository.index({
      identifiers: {
        serviceURL: downDetectorResult.url
      },
      orderBy: { property: 'id', orientation: 'desc' },
      limit: 1
    })

    if (lastRegistryOfChange.length === 0) {
      await downDetectorChangeRepository.create({
        site_c: downDetectorResult.url,
        hist_date: moment().format('YYYY-MM-DD HH:mm:ss'),
        status_anterior: 0,
        status_atual: this.changeStringStatusToInteger(downDetectorResult.status),
        status_change: this.createChangeInteger(lastRegistryOfChange, downDetectorResult)
      })
        .catch(error => {})
    }

    if (lastRegistryOfChange.length > 0 && lastRegistryOfChange[0].status_atual !== this.changeStringStatusToInteger(downDetectorResult.status)) {
      await downDetectorChangeRepository.create({
        site_c: downDetectorResult.url,
        hist_date: moment().format('YYYY-MM-DD HH:mm:ss'),
        status_anterior: lastRegistryOfChange[0].status_atual,
        status_atual: this.changeStringStatusToInteger(downDetectorResult.status),
        status_change: this.createChangeInteger(lastRegistryOfChange, downDetectorResult)
      })
        .catch(error => {})
    }
  }

  public createOrUpdateServiceUpdateTime = async (routine: number) => {
    const routineRegistry = await servicesUpdateTimeRepository.get({ routine })
      .catch(error => {
        console.log(error)
        return undefined
      })

    if (!routineRegistry) {
      await servicesUpdateTimeRepository.create({ routine })
    } else {
      await servicesUpdateTimeRepository.update({ routine })
    }
  }

  public emitUpdateTime = async (ioServer: Server) => {
    const emitCall = 'routines_update_time' 

    const routinesUpdateTime = await servicesUpdateTimeRepository.index()
    // const monitoring = await monitoringRepository.index()
  
    ioServer.emit(emitCall, routinesUpdateTime)
  }

  public emitExecutionRoutine = async (ioServer: Server, updateTime: number) => {
    const emitCall = `routine_${updateTime}`

    ioServer.emit(emitCall, '')
  }

  private normalizeDownDetectorResult = (downDetectorResult: downDetectorSearchResult) => {
    const baselines = downDetectorResult.baseline
    const reports = downDetectorResult.reports

    const data = baselines.map((baseline, index) => {
      return {
        date: moment(baseline.x).format('YYYY-MM-DD HH:mm:ss'),
        baseline: baseline.y,
        notificationCount: reports[index].y
      }
    })

    return data
  }

  public accessDownDetectorSingleUpdate = async (req: Request, res: Response) => {
    const { serviceName } = req.params

    const browser = await puppeteer.launch({ 
      headless: true, 
      args: ['--no-sandbox'], 
      slowMo: 200
    })

    const page = await browser.newPage()

    await page.setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.108 Safari/537.36')
    await page.setDefaultNavigationTimeout(0)

    await page.goto(this.makeUrl(serviceName))
      .catch(error => {
        console.log(error)
      })

    const data = await page.evaluate(() => {
      const titleElement = document.getElementsByClassName('entry-title')[0]
      const titleTextContent = String(titleElement.textContent)
      
      // get title
      const firstLetter = titleTextContent.indexOf('User')
      const textSlicedToFirstLetter = titleTextContent.slice(firstLetter, titleTextContent.length)
      const title = textSlicedToFirstLetter.slice(0, textSlicedToFirstLetter.indexOf('\n'))

      const currentServiceProperties = window['DD']['currentServiceProperties']
      const status: string = currentServiceProperties['status']
      const series = currentServiceProperties['series']
      const baseline: Array<downDetectorData> = series['baseline']['data']
      const reports: Array<downDetectorData> = series['reports']['data']

      return {
        name: title.split(' ')[title.split('').length - 1],
        title,
        status,
        baseline,
        reports
      }
    })

    const result: downDetectorSearchResult = {
      url: this.makeUrl(serviceName),
      ...data
    }

    const normalizedData = this.normalizeDownDetectorResult(result)
    const registryDataPromises = normalizedData.map(async (downDetectorReport) => {
      await downDetectorHistRepository.create({
        site_d: result.url,
        hist_date: downDetectorReport.date,
        baseline: downDetectorReport.baseline,
        notification_count: downDetectorReport.notificationCount
      })
        .catch(error => {})
    })

    await this.updateChangeHistory(result)
    await Promise.all(registryDataPromises)

    await browser.close()

    return res.status(200).json({
      message: 'serviço atualizado com sucesso!'
    })
  }
}