import { Request, Response } from 'express'

import { AppError, errorHandler } from './../utils/handleError'

import {
  hostsPerfilsRepository
} from './../repositories'

interface createReqBody {
  name: string, 
  user: string, 
  password: string, 
  url: string, 
  link: string
}

interface updateReqParams {
  id: number
}

interface updateReqBody {
  name?: string,
  user?: string,
  password?: string,
  url?: string,
  link?: string
}

interface deleteReqParams {
  id: number
}

export default class HostPerfisController {
  public create = async (req: Request, res: Response) => {
    const {
      name,
      user,
      password,
      url,
      link
    } = req.body as createReqBody

    return await hostsPerfilsRepository.create({
      name, user, password, url, worksheet_link: link
    })
      .then(() => {
        return res.status(200).json({
          message: 'host perfil created sucessful!'
        })
      })
      .catch(error => {
        return errorHandler(
          new AppError('Creation error', 403, 'not possible to create host perfil, verify informations', true),
          res
        )
      })
  }

  public index = async (req: Request, res: Response) => {
    const data = await hostsPerfilsRepository.index()

    return res.status(200).json({
      data: data
    })
  }

  public update = async (req: Request<updateReqParams>, res: Response) => {
    const { id } = req.params
    const {
      name,
      user,
      password,
      url,
      link
    } = req.body as updateReqBody

    let payload: {
      name?: string,
      user?: string,
      password?: string,
      url?: string,
      worksheet_link?: string
    } = {}

    if (!!name) payload.name = name
    if (!!user) payload.user = user
    if (!!password) payload.password = password
    if (!!url) payload.url = url
    if (!!link) payload.worksheet_link = link

    return await hostsPerfilsRepository.update({
      identifiers: { id },
      payload: { ...payload }
    })
      .then(() => {
        return res.status(200).json({
          message: 'host perfil atualizado com sucesso!'
        })
      })
      .catch(error => {
        console.log(error)

        return errorHandler(
          new AppError('Creation error', 403, 'not possible to update host perfil, verify informations', true),
          res
        )
      })
  }

  public delete = async (req: Request<deleteReqParams>, res: Response) => {
    const { id } = req.params

    return await hostsPerfilsRepository.delete({ id })
      .then(() => {
        return res.status(200).json({
          message: 'host perfil deletado com sucesso!'
        })
      })
      .catch(error => {
        return errorHandler(
          new AppError('Creation error', 403, 'not possible to delete host perfil, verify informations', true),
          res
        )
      })
  }
}