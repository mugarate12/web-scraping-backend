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
          message: 'service added to monitoring successful!'
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
          message: 'update service monitoring time successful!'
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
          message: 'delete service monitoring successful!'
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