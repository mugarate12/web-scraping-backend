import { Request, Response } from 'express'

import {
  apiAccessClientsRepository,
  apiAccessTokensRepository,
  clientsAccessRepository,
  downDetectorChangeRepository,
  downDetectorHistRepository,
  servicesRepository,
  permissionsRepository
} from './../repositories'
import { errorHandler, AppError } from './../utils/handleError'
import createToken from '../utils/createToken'

export default class ApiAccessController {
  private makeUrl = (service: string) => {
    console.log(service);
    const url = `https://downdetector.com/status/${service}`

    return url
  }

  private convertStatusToString = (status: number) => {
    // initial value = 0
    // warning = 1 
    // danger = 2
    // success = 3

    if (status === 1) {
      return 'atenção'
    } else if (status === 2) {
      return 'perigo'
    } else {
      return 'sucesso'
    }
  }

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

  public status = async (req: Request, res: Response) => {
    const {
      serviceName
    } = req.params

    const haveService = await servicesRepository.get({ serviceName: String(serviceName) })
      .then((service) => {
        if (!service) {
          return false
        } else {
          return true
        }
      })
      .catch(error => false)

    if (!haveService) {
      return res.status(406).json({
        message: 'serviço não é monitorado por nossa base de dados'
      })
    }

    const serviceURL = this.makeUrl(String(serviceName))

    const lastRegistryOfChange = await downDetectorChangeRepository.index({
      identifiers: { serviceURL: serviceURL },
      orderBy: { property: 'id', orientation: 'desc' },
      limit: 1
    })

    const lastRegistryOfHistory = await downDetectorHistRepository.index({
      serviceURL: serviceURL,
      orderBy: { property: 'id', orientation: 'desc' },
      limit: 1
    })

    if (lastRegistryOfChange.length === 0 || lastRegistryOfHistory.length === 0) {
      console.log(lastRegistryOfChange);
      console.log(lastRegistryOfHistory);
      
      return res.status(406).json({
        message: 'aguarde o serviço começar a ser atualizado por nossas rotinas'
      })
    }

    const status = this.convertStatusToString(lastRegistryOfChange[0].status_atual)
    const baseline = lastRegistryOfHistory[0].baseline
    const reports = lastRegistryOfHistory[0].notification_count

    return res.status(200).json({
      status,
      baseline,
      reports
    })
  }
}