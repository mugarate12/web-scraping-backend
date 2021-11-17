import { Request, Response } from 'express'

import {
  downDetectorHistRepository,
  servicesRepository,
  servicesUpdateTimeRepository
} from './../repositories'
import { errorHandler, AppError } from './../utils/handleError'

import { updateServiceInterface } from './../repositories/servicesRepository'

export default class servicesController {
  public add = async (req: Request, res: Response) => {
    const {
      serviceName,
      updateTime
    } = req.body

    return await servicesRepository.create({
      serviceName,
      update_time: Number(updateTime)
    })
      .then(() => {
        return res.status(201).json({
          message: 'serviços adicionados com sucesso!'
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
    return await servicesRepository.index({})
      .then(response => {
        return res.status(200).json({
          message: 'serviços recuperados com sucesso!',
          services: response
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
    const {
      updateTime,
      able
    } = req.body
    const { serviceID } = req.params

    const updatePayload: updateServiceInterface = {
      id: Number(serviceID)
    }

    if (!!updateTime) {
      updatePayload.update_time = Number(updateTime)
    }

    if (able !== undefined) {
      updatePayload.habilitado = Number(able)
    }

    return await servicesRepository.update(updatePayload)
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
    const { serviceID } = req.params

    return await servicesRepository.delete(Number(serviceID))
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

  public getServicesUpdateTime = async (req: Request, res: Response) => {
    const routinesUpdateTime = await servicesUpdateTimeRepository.index()

    return res.status(200).json({
      message: 'tempo de atualização recuperado com sucesso!',
      data: routinesUpdateTime
    })
  }
}