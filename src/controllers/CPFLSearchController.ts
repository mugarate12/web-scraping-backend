import { Request, Response } from 'express'
import dotenv from 'dotenv'
import jwt from 'jsonwebtoken'

import { 
  cpflSearchRepository,
  cpflSearchNowRepository,
  cpflSearchUpdateTimeRepository,
  cpflDataRepository,
  energyPermissionsRepository,
  apiAccessClientsRepository
} from './../repositories'

import { CPFFSearchInterface } from './../repositories/CPFLSearchRepository'
import { EnergyPermissionsInterface } from './../repositories/EnergyPermissionsRepository'

import {
  cpflController
} from './'

import { errorHandler, AppError } from './../utils/handleError'

dotenv.config()

type citiesInterface = Array<{
  value: string;
  label: string;
}>

type clientsKeys = Array<number>

const JWT_SECRET = process.env.JWT_SECRET || 'Secret'

export default class CPFLSearchController {
  private dealerships = [{
    label: 'CPFL',
    value: 'cpfl'
  }]
  private updates_times = [{
    label: '15 minutos',
    value: 15
  }, {
    label: '30 minutos',
    value: 30
  }, {
    label: '45 minutos',
    value: 45
  }, {
    label: '60 minutos',
    value: 60
  }, {
    label: 'Duas horas',
    value: 120
  }, {
    label: 'Três horas',
    value: 180
  }, {
    label: 'Cinco horas',
    value: 300
  }]

  public create = async (req: Request, res: Response) => {
    const {
      city,
      state,
      dealership,
      update_time,
      clientsKeys
    } = req.body

    let haveError = false
    let responseError: AppError | undefined

    console.log(clientsKeys)

    await cpflSearchNowRepository.create({ city, state })
      .catch((error: AppError) => {
        haveError = true
        responseError = error
      })

    if (haveError && !!responseError) {
      return errorHandler(
        new AppError(responseError.name, 403, responseError.message, true),
        res
      )
    }

    // await cpflSearchRepository.create({ city, state, dealership, update_time: Number(update_time) })

    return await cpflSearchRepository.create({ city, state, dealership, update_time: Number(update_time) })
      .then(async () => {
        const search = await cpflSearchRepository.get({ state, city, update_time: Number(update_time), dealership })
        
        if (!!search) {
          cpflSearchUpdateTimeRepository.create({ cpfl_search_FK: search.id })
          console.log('search id', search.id)
        
          const requests = clientsKeys.map(async (clientKey: number) => {
            await energyPermissionsRepository.create({
              cpfl_search_FK: search.id,
              client_FK: clientKey
            })
              .catch(error =>  {
                console.log(error)
              })
          })

          await Promise.all(requests)
        }

        return res.status(201).json({
          message: 'serviço criado com sucesso!'
        })
      })
      .catch((error: AppError) => {
        return errorHandler(
          new AppError(error.name, 403, error.message, true),
          res
        )
      })
  }

  public index = async (req: Request, res: Response) => {
    return await cpflSearchRepository.index({})
      .then((searches) => {
        return res.status(200).json({
          messae: 'serviços recuperados com sucesso!',
          data: searches
        })
      })
      .catch((error: AppError) => {
        return errorHandler(
          new AppError(error.name, 403, error.message, true),
          res
        )
      })
  }

  public update = async (req: Request, res: Response) => {
    const { id } = req.params
    const { able, updateTime } = req.body

    let update: {
      able?: number,
      update_time?: number
    } = {}

    if (!!able) {
      update.able = Number(able)
    }

    if (!!updateTime) {
      update.update_time = Number(updateTime)
    }
    
    return await cpflSearchRepository.update({ 
      id: Number(id), 
      ...update
    })
      .then(() => {
        return res.status(200).json({
          message: 'serviço atualizado com sucesso!'
        })
      })
      .catch((error: AppError) => {
        return errorHandler(
          new AppError(error.name, 403, error.message, true),
          res
        )
      })
  }

  public delete = async (req: Request, res: Response) => {
    const { id } = req.params

    const search = await cpflSearchRepository.get({ id: Number(id) })
    
    await cpflSearchUpdateTimeRepository.delete({ cpfl_search_FK: Number(id) })

    if (!!search) {
      if (search.dealership === 'cpfl') {
        await cpflDataRepository.delete({ state: search.state, city: search.city })
      }
     
      await energyPermissionsRepository.delete({ cpfl_search_FK: search.id })
    }

    return await cpflSearchRepository.delete({ id: Number(id) })
      .then(async () => {
        return res.status(200).json({
          message: 'serviço deletado com sucesso!'
        })
      })
      .catch((error: AppError) => {
        console.log(error)
        return errorHandler(
          new AppError(error.name, 403, error.message, true),
          res
        )
      })
  }

  public getDealerShips = async (req: Request, res: Response) => {
    return res.status(200).json({
      data: this.dealerships
    })
  }

  public getUpdatesTimes = async (req: Request, res: Response) => {
    return res.status(200).json({
      data: this.updates_times
    })
  }

  public getStates = async (req: Request, res: Response) => {
    const { dealership } = req.params

    let states: Array<string> = []

    if (dealership === 'cpfl') {
      states = cpflController.states
    }
    return res.status(200).json({
      message: 'estados recuperados com sucesso!',
      data: cpflController.formatStatesToFrontend(states)
    })
  }

  public getCities = async (req: Request, res: Response) => {
    const { dealership, state } = req.params

    let cities: citiesInterface = []

    if (dealership === 'cpfl' && (state === 'paulista' || state === 'sp')) {
      cities = cpflController.SPcities
    } else if (dealership === 'cpfl' && (state === 'santa cruz' || state === 'sc')) {
      cities = cpflController.SantaCruzCities
    } else if (dealership === 'cpfl' && (state === 'piratininga' || state === 'pt')) {
      cities = cpflController.PiratiningaCities
    } else if (dealership === 'cpfl' && (state === 'rio grande do sul' || state === 'rs')) {
      cities = cpflController.RScities
    }

    return res.status(200).json({
      message: 'cidades recuperadas com sucesso!',
      data: cities
    })
  }

  public getLastExecution = async (req: Request, res: Response) => {
    return await cpflSearchUpdateTimeRepository.index()
      .then(searchs => {
        return res.status(200).json({
          data: searchs
        })
      })
      .catch((error: AppError) => {
        return errorHandler(
          new AppError(error.name, 403, error.message, true),
          res
        )
      })
  }

  private haveEnergyPermission = (search: CPFFSearchInterface, energyPermissions: EnergyPermissionsInterface[]) => {
    let have = false

    energyPermissions.forEach(energyPermission => {
      if (energyPermission.cpfl_search_FK === search.id) {
        have = true
      }
    })

    return have
  }

  public getCitiesToClientKeyHaveAccess = async (req: Request, res: Response) => {
    const { dealership, state, clientKey } = req.params
    let userID: number = 0
    let stateFormatted: string = ''

    if (dealership === 'cpfl' && (state === 'paulista' || state === 'sp')) {
      stateFormatted = 'paulista'
    } else if (dealership === 'cpfl' && (state === 'santa cruz' || state === 'sc')) {
      stateFormatted = 'santa cruz'
    } else if (dealership === 'cpfl' && (state === 'piratininga' || state === 'pt')) {
      stateFormatted = 'piratininga'
    } else if (dealership === 'cpfl' && (state === 'rio grande do sul' || state === 'rs')) {
      stateFormatted = 'rio grande do sul'
    }

    await jwt.verify(clientKey, JWT_SECRET, (error, decoded) => {
      if (error) {
        return errorHandler(new AppError('Authorization Error', 401, 'client key não autorizado', true), res)
      }

      userID = Number(decoded?.id)
    })

    const energyPermissions = await energyPermissionsRepository.index({
      client_FK: userID
    })

    const searchs = await cpflSearchRepository.index({ dealership, state: stateFormatted })
    
    const searchsOfUserHavePermission = searchs.filter(search => this.haveEnergyPermission(search, energyPermissions))

    return res.status(200).json({
      data: searchsOfUserHavePermission
    })
  }

  public getSearchsPerClients = async (req: Request, res: Response) => {
    const data = await energyPermissionsRepository.indexPerClients()

    return res.status(200).json({
      message: 'ok',
      data
    })
  }
}