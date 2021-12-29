import { Request, Response } from 'express'

import { 
  cpflSearchRepository,
  cpflSearchNowRepository
} from './../repositories'

import { errorHandler, AppError } from './../utils/handleError'

export default class CPFLSearchController {
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
}