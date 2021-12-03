import { Request, Response } from 'express'
import puppeteer from 'puppeteer'
import moment from 'moment'
import { Server } from 'socket.io'
import axios from 'axios'

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
  private apiKey = 'e797b8f0c894bbcf9017ee47f7bbbf1e'

  private makeUrl = (service: string) => {
    const url = `https://downdetector.com/status/${service}`

    return url
  }

  private sleep = (seconds: number) => {
    return new Promise(resolve => setTimeout(resolve, 1000 * seconds))
  }

  private requestToSolveCaptcha = async (sitekey: string, pageURL: string) => {
    interface successfulRequest {
      status: number,
      request: string
    }

    const url = `http://2captcha.com/in.php?key=${this.apiKey}&method=hcaptcha&sitekey=${sitekey}&pageurl=${pageURL}&json=true`

    return await axios.get<successfulRequest>(url)
      .then(response => {
        return response.data
      })
      .catch(error => {
        console.log('error in request solve captcha')
        console.log(error)

        return undefined
      })
  }

  private getJsonToSolvedCaptcha = async (captchaID: number) => {
    interface responseInterface {
      status: number,
      request: string
    }

    const url = `https://2captcha.com/res.php?key=${this.apiKey}&action=get&id=${captchaID}&json=true`

    return await axios.get<responseInterface>(url)
      .then(response => {
        return response.data
      })
      .catch(error => {
        console.log('get jason to solved captcha error')
        console.log(error)

        return undefined
      })
  }

  private updateHistoryAndChange = async (result: downDetectorSearchResult) => {
    const normalizedData = this.normalizeDownDetectorResult(result)
    let insertions: Array<{
      site_d: string,
      hist_date: string,
      baseline: number,
      notification_count: number
    }> = []

    for (let index = 0; index < normalizedData.length; index++) {
      const report = normalizedData[index]
  
      insertions.push({
        site_d: result.url,
        hist_date: report.date,
        baseline: report.baseline,
        notification_count: report.notificationCount
      })
    }

    await this.updateChangeHistory(result)
    
    if (insertions.length > 0) {
      await downDetectorHistRepository.createInMassive(insertions)
        .catch(error => {
          console.log(error);
        })
    }
  }

  public accessDownDetector = async (req: Request, res: Response) => {
    const { serviceName } = req.params
    
    const browser = await puppeteer.launch({ 
      headless: true,
      args: [
        '--no-sandbox'
      ]
    })
    const page = await browser.newPage()

    await page.setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.108 Safari/537.36')

    await page.setDefaultNavigationTimeout(0)
    
    const url2 = `https://downdetector.com.br/fora-do-ar/${serviceName}`
    let status: number = 200
    let data: any = {}
    let result: {
      title: string;
      status: string;
      baseline: downDetectorData[];
      reports: downDetectorData[];
    } = {
      title: '',
      status: '',
      baseline: [],
      reports: []
    }

    await page.goto(url2, { waitUntil:'load'})
      .then(response => {
        status = response.status()
      })
      .catch(error => {
        console.log(error)
      })

      if (status !== 200) {
        let currentStatus = status
        
        while (currentStatus !== 200) {
          await this.sleep(5)

          await page.reload()
            .then(response => {
              console.log(response?.status())

              currentStatus = Number(response?.status())
            })
            .catch(error => {
              console.log(error)
            })
        }

        const getDataResponse = await page.evaluate(() => {
          const titleElement = document.getElementsByClassName('entry-title')[0]
          const titleTextContent = String(titleElement.textContent)
          
          // get title
          const removeBreakLines = titleTextContent.split('\n')[4]
          const title = removeBreakLines.trim()
          // const firstLetter = titleTextContent.indexOf('User')
          // const textSlicedToFirstLetter = titleTextContent.slice(firstLetter, titleTextContent.length)
          // const title = textSlicedToFirstLetter.slice(0, textSlicedToFirstLetter.indexOf('\n'))

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

        result = getDataResponse
      }

    await browser.close()

    return res.json({
      result
    })
  }

  public accessDownDetectorRoutine = async (serviceName: string, browser: puppeteer.Browser) => {
    const url = this.makeUrl(serviceName)

    const pageInstance = await browser.newPage()
    await pageInstance.setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.108 Safari/537.36')

    await pageInstance.setDefaultNavigationTimeout(0)
    await pageInstance.goto(url)
      .catch(error => {
        
      })

    // console.log(`-> executando coleta em: ${serviceName}`)

    let data: {
      name: string;
      title: string;
      status: string;
      baseline: downDetectorData[];
      reports: downDetectorData[];
    } = {
      name: '',
      title: '',
      status: '',
      baseline: [],
      reports: []
    }

    await this.sleep(2)

    while (data.baseline.length === 0) {
      await pageInstance.evaluate(() => {
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
        .then(result => {
          data = result
        })
        .catch(async (error) => {
          // console.log(`!!! erro na coleta em ${serviceName}, recarregando página`);
          await pageInstance.reload()
        })
    }

    const result: downDetectorSearchResult = {
      url,
      ...data
    }
    
    await this.updateHistoryAndChange(result)

    // console.log(`${serviceName} status: ${data.status}`)

    pageInstance.close()
      .catch(error => {})

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

  public createOrUpdateServiceUpdateTime = async (routine: number, lastExecution: string) => {
    const routineRegistry = await servicesUpdateTimeRepository.get({ routine })
      .catch(error => {
        console.log(error)
        return undefined
      })

    if (!routineRegistry) {
      await servicesUpdateTimeRepository.create({ routine, lastExecution })
    } else {
      await servicesUpdateTimeRepository.update({ routine, lastExecution })
    }
  }

  public emitUpdateTime = async (ioServer: Server) => {
    const emitCall = 'routines_update_time' 

    const routinesUpdateTime = await servicesUpdateTimeRepository.index()
  
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

  private haveBaselineOrReportsInHour = (histories: Array<any>, baseline: number, reports: number) => {
    let have = false

    histories.forEach((history) => {
      if (history.baseline === baseline && history.notification_count === reports) {
        have = true
      }
    })

    return have
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
      let createRegistry = false

      await downDetectorHistRepository.index({
        serviceURL: this.makeUrl(serviceName),
        dates: [ downDetectorReport.date.split(':')[0] ]
      })
        .then(response => {
          // console.log('date', downDetectorReport.date.split(':')[0]);
          // console.log('baseline', downDetectorReport.baseline);
          // console.log('reports', downDetectorReport.notificationCount);
          createRegistry = !this.haveBaselineOrReportsInHour(response, downDetectorReport.baseline, downDetectorReport.notificationCount)
          // console.log('criar registro', createRegistry);
        })
      
      if (createRegistry) {
        await downDetectorHistRepository.create({
          site_d: result.url,
          hist_date: downDetectorReport.date,
          baseline: downDetectorReport.baseline,
          notification_count: downDetectorReport.notificationCount
        })
          .catch(error => {})
      }
    })

    await this.updateChangeHistory(result)
    await Promise.all(registryDataPromises)

    await browser.close()

    return res.status(200).json({
      message: 'serviço atualizado com sucesso!'
    })
  }

  public accessDownDetectorSingleUpdateNotRoute = async (serviceName: string) => {
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
      let createRegistry = false

      await downDetectorHistRepository.index({
        serviceURL: this.makeUrl(serviceName),
        dates: [ downDetectorReport.date.split(':')[0] ]
      })
        .then(response => {
          createRegistry = this.haveBaselineOrReportsInHour(response, downDetectorReport.baseline, downDetectorReport.notificationCount)
        })
      
      if (createRegistry) {
        await downDetectorHistRepository.create({
          site_d: result.url,
          hist_date: downDetectorReport.date,
          baseline: downDetectorReport.baseline,
          notification_count: downDetectorReport.notificationCount
        })
          .catch(error => {})
      }
    })

    await this.updateChangeHistory(result)
    await Promise.all(registryDataPromises)

    await browser.close()
  }
}