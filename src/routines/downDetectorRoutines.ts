import { Server } from 'socket.io'
import puppeteer from 'puppeteer'
import moment from 'moment'
import Redis from 'promise-redis'
import dotenv from 'dotenv'

dotenv.config()
const redis = Redis()
const client = redis.createClient()

client.on("error", (error) => {
  console.error(error);
})

import {
  downDetectorController
} from './../controllers'

import {
  downDetectorChangeRepository,
  downDetectorHistRepository,
  downDetectorRoutineExecutionRepository,
  monitoringRepository,
  servicesRepository
} from './../repositories'

import { serviceInterface } from './../repositories/servicesRepository'

import { downDetectorChangeInterface } from './../repositories/downDetectorChangeRepository'
import { downDetectorHistInterface } from './../repositories/downDetectorHistRepository'
import { downDetectorSearchResult } from './../interfaces/downDetector'

const processName = process.env.name || 'primary'

async function runBrowser() {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'], slowMo: 200 })
  return browser
}

async function sleep(milliseconds: number) {
  return new Promise(resolve => setTimeout(resolve, milliseconds))
}

function createArraysOfRequests(requests: serviceInterface[], numberOfMultipleTabs: number) {
  let arraysOfRequests: Array<Array<serviceInterface>> = []
  let maintenanceArray: Array<serviceInterface> = []

  requests.forEach((element, index) => {
    if ((index + 1) % numberOfMultipleTabs === 0) {
      arraysOfRequests.push(maintenanceArray)
      maintenanceArray = []
    }

    if ((index + 1) === requests.length) {
      maintenanceArray.push(element)
      arraysOfRequests.push(maintenanceArray)
    } else {
      maintenanceArray.push(element)
    }
  })

  return arraysOfRequests
}

function createHeadquarterOfServices(requests: serviceInterface[]) {
  let headquarter: Array<serviceInterface[]> = []
  
  const numberOfProcessors = Number(process.env.NUMBER_OF_PROCESSORS)

  const numberOfItemsPerProcess = requests.length / numberOfProcessors
  const firstNumber = Number(String(numberOfItemsPerProcess)[0])

  console.log('número de processos: ', numberOfProcessors)


  for (let index = 0; index < numberOfProcessors; index++) {
    // const element = array[index];
    if (index === 0) {
      headquarter.push(requests.slice(0, firstNumber))
    } else {
      const initial = firstNumber * index
      const final = firstNumber * (index + 1)

      headquarter.push(requests.slice(initial, final))
    }
  }

  const items = firstNumber * numberOfProcessors
  if (items < requests.length) {
    headquarter.push(requests.slice(items, requests.length))
  }

  console.log(headquarter.length);
  return headquarter
}

function createArrayOfRequestToProcess(headquarter: Array<serviceInterface[]>, requests: serviceInterface[]) {
  let processRequests: serviceInterface[] = []

  const processName = process.env.name || 'primary'
  const numberOfProcessors = Number(process.env.NUMBER_OF_PROCESSORS)
  const appInstance = Number(process.env.INSTANCE_ID)

  const numberOfItemsPerProcess = requests.length / numberOfProcessors
  const firstNumber = Number(String(numberOfItemsPerProcess)[0])

  const items = firstNumber * numberOfProcessors

  if(processName.search(/primary/) !== -1) {
      if (items < requests.length) {
        processRequests = [ ...headquarter[0], ...headquarter[headquarter.length - 1] ]
      } else {
        processRequests = [ ...headquarter[0] ]
      }
  } else {
    try {
      // console.log('app instance:', appInstance);
      processRequests = [ ...headquarter[appInstance + 1] ]
    } catch (error) {
      console.log(error)
    }
  }

  return processRequests
}

export default async function routinesRequests(serverIo: Server, browser: puppeteer.Browser, updateTime: number) {  
  const requests = await servicesRepository.index({ update_time: updateTime, habilitado: 1 })
    .then(services => services)
    .catch(error => console.log('error', error))
  
  const lastExecution = moment().format('YYYY-MM-DD HH:mm:ss')
  
  const RedisKey = `downDetectorRoutine_${updateTime}`
  const completeRedisKey = `finished_routine_${updateTime}`

  
  if (!!requests && requests.length > 0) {
    sleep(200 * Math.random() * 100)
    const routineStatus = await client.get(RedisKey)
    const completeKeyStatus = await client.get(completeRedisKey)
    
    if (Number(completeKeyStatus) === 2) {
      return
    } else {
      await client.set(completeRedisKey, 2)
      await client.expire(completeRedisKey, 120)
    }
    
    console.log(`--> Requisitando serviços de update em ${updateTime} minuto(s) \n`)
    console.log(`--> Requisitando ${requests.length} serviços`)
    console.log('--> começo da execução:', moment().subtract(3, 'hours').format('YYYY-MM-DD HH:mm:ss'))

    // console.log(createHeadquarterOfServices(requests))
    // const headquarter = createHeadquarterOfServices(requests)
    // const req = createArrayOfRequestToProcess(headquarter, requests)

    // console.log(req)

    await downDetectorController.emitExecutionRoutine(serverIo, updateTime)

    const requestsResultsPromises = requests.map(async (request, index) => {
      const result = await downDetectorController.accessDownDetectorRoutine(request.service_name, browser)
        .catch(error => {
          console.log('error em', request.service_name)
          console.log(error)
          return undefined
        })

      // console.log(`-> (${index + 1}) ${request.service_name} da rotina ${updateTime} minuto(s), status: ${result?.status}`)
    })

    await Promise.all(requestsResultsPromises)
    
    // await client.set(RedisKey, 1)
    
    await client.set(completeRedisKey, 1)
    console.log(`--> Final da execução: ${moment().subtract(3, 'hours').format('YYYY-MM-DD HH:mm:ss')}`)
    console.log(`\n--> Requisições da rotina de ${updateTime} minuto(s) finalizadas\n`)
  }

  await downDetectorController.createOrUpdateServiceUpdateTime(updateTime, lastExecution)
  await downDetectorController.emitUpdateTime(serverIo)

  await downDetectorRoutineExecutionRepository.update(updateTime, 1)
}