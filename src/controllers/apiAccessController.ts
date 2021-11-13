import { Request, Response } from 'express'

import {
  apiAccessClientsRepository,
  apiAccessTokensRepository,
  clientsAccessRepository,
  permissionsRepository
} from './../repositories'
import { errorHandler, AppError } from './../utils/handleError'
import createToken from '../utils/createToken'

export default class ApiAccessController {
  public create = async (req: Request, res: Response) => {
    const {
      identifier
    } = req.body

    const createClient = await apiAccessClientsRepository.create({ identifier: String(identifier) })
      .then(() => {
        return true
      })
      .catch(() => {
        return false
      })

    if (!createClient) {
      return res.status(406).json({
        message: 'usuário já existe na base de dados'
      })
    }

    const clientID = await apiAccessClientsRepository.get({ identifier: String(identifier) })
      .then(client => client.id)
      .catch(error => console.log(error))

    const token = createToken(Number(clientID))

    const permissionToViewData = await permissionsRepository.get({
      identifier: 'ACCESS_API_ACCESS_VIEW'
    })

    await clientsAccessRepository.create({
      client_FK: Number(clientID),
      permissions: [ permissionToViewData.id ]
    })
      .catch(error => {
        console.log('erro ao criar permissão')
      })

    await apiAccessTokensRepository.create({
      key: token,
      api_access_client_FK: Number(clientID)
    })
      .catch(error => {
        console.log('erro ao criar acesso via token')
      })

    return res.status(201).json({
      message: 'acesso criado com sucesso!'
    })
  }
}