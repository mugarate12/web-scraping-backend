import { Request, Response } from 'express'

import {
  servicesRepository
} from './../repositories'
import { errorHandler, AppError } from './../utils/handleError'

export default class servicesController {
  public add = async (req: Request, res: Response) => {
    const {
      serviceName,
      updateTime
    } = req.body

    await servicesRepository.create({
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
    await servicesRepository.index({})
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
      updateTime
    } = req.body
    const { serviceID } = req.params

    await servicesRepository.update({
      id: Number(serviceID),
      update_time: Number(updateTime)
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
    const { serviceID } = req.params

    await servicesRepository.delete(Number(serviceID))
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
}