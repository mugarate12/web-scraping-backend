import { Request, Response } from 'express'

import { 
  cpflSearchRepository,
  cpflSearchNowRepository
} from './../repositories'

import {
  cpflController
} from './'

import { errorHandler, AppError } from './../utils/handleError'

type citiesInterface = Array<{
  value: string;
  label: string;
}>

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
  }]

  public create = async (req: Request, res: Response) => {
    const {
      city,
      state,
      dealership,
      update_time
    } = req.body

    let haveError = false
    let responseError: AppError | undefined

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

    return await cpflSearchRepository.create({ city, state, dealership, update_time: Number(update_time) })
      .then(() => {
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
    const { able } = req.body
    
    return await cpflSearchRepository.update({ id: Number(id), able: Number(able) })
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

    return await cpflSearchRepository.delete({ id: Number(id) })
      .then(() => {
        return res.status(200).json({
          message: 'serviço deletado com sucesso!'
        })
      })
      .catch((error: AppError) => {
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
}