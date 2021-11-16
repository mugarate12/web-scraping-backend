import { Request, Response } from 'express'
import moment from 'moment'

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

  private convertChangeStatusToString (changeStatus: number) {
    // warning to danger = 1
    // warning to success = 2
    // danger to warning = 3
    // danger to success = 4
    // success to warning = 5
    // success to danger = 6
    if (changeStatus === 0) {
      return 'inicio do monitoramento'
    } else if (changeStatus === 1) {
      return 'mudança de atenção para perigo'
    } else if (changeStatus === 2) {
      return 'mudança de atenção para estável'
    } else if (changeStatus === 3) {
      return 'mudança de perigo para atenção'
    } else if (changeStatus === 4) {
      return 'mudança de perigo para estável'
    } else if (changeStatus === 5) {
      return 'mudança de estável para atenção'
    } else {
      return 'mudança de estável para perigo'
    }
  }

  private verifyServiceExistsAndAble = async (serviceName: string) => {
    return await servicesRepository.get({ serviceName: String(serviceName) })
    .then((service) => {
      if (!service) {
        return false
      } else {
        if (service.habilitado === 2) {
          return false
        } else {
          return true
        }
      }
    })
    .catch(error => false)
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

  public index = async (req: Request, res: Response) => {
    const data = await apiAccessTokensRepository.index()

    return res.status(200).json({
      data: data
    })
  }

  public delete = async (req: Request, res: Response) => {
    const {
      identifier
    } = req.params

    const client = await apiAccessClientsRepository.get({ identifier: String(identifier) })
    await clientsAccessRepository.delete({ client_FK: client.id })
    await apiAccessTokensRepository.delete({ api_access_client_FK: client.id })
    await apiAccessClientsRepository.delete({ id: client.id })

    return res.status(200).json({
      message: 'cliente deletado com sucesso!'
    })
  }

  public status = async (req: Request, res: Response) => {
    const {
      serviceName
    } = req.params

    const haveService = await this.verifyServiceExistsAndAble(String(serviceName))

    if (!haveService) {
      return res.status(406).json({
        message: 'serviço não é monitorado por nossa base de dados ou não está habilitado'
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
      return res.status(406).json({
        message: 'aguarde o serviço começar a ser atualizado por nossas rotinas'
      })
    }

    const status = this.convertStatusToString(lastRegistryOfChange[0].status_atual)
    const baseline = lastRegistryOfHistory[0].baseline
    const reports = lastRegistryOfHistory[0].notification_count
    const date = moment(lastRegistryOfHistory[0].hist_date).format('DD-MM-YYYY HH:mm:ss')

    return res.status(200).json({
      date,
      status,
      baseline,
      reports
    })
  }

  public history = async (req: Request, res: Response) => {
    const {
      serviceName
    } = req.params
    const {
      dataInicial,
      dataFinal
    } = req.query

    const haveService = await this.verifyServiceExistsAndAble(String(serviceName))

    if (!haveService) {
      return res.status(406).json({
        message: 'serviço não é monitorado por nossa base de dados ou não está habilitado'
      })
    }

    const serviceURL = this.makeUrl(String(serviceName))
    const lastSevenDaysDate = moment().subtract(7, 'days').format('YYYY-MM-DD')

    const lastRegistryOfChange = await downDetectorChangeRepository.index({
      identifiers: { serviceURL: serviceURL },
      orderBy: { property: 'id', orientation: 'desc' },
      limit: 1
    })

    const histories = await downDetectorHistRepository.index({
      serviceURL,
      initialDate: !!dataInicial ? String(dataInicial) : lastSevenDaysDate,
      finalDate: !!dataFinal ? String(dataFinal) : '',
    })
    
    const status = this.convertStatusToString(lastRegistryOfChange[0].status_atual)
    const reportsAndBaselines = histories.map((history) => {
      return {
        date: moment(history.hist_date).format('YYYY-MM-DD HH:mm:ss'),
        reports: history.notification_count,
        baseline: history.baseline
      }
    })

    const data = {
      status,
      data: reportsAndBaselines
    }

    return res.status(200).json({
      ...data
    })
  }

  public changes = async (req: Request, res: Response) => {
    const {
      serviceName
    } = req.params
    const {
      dataInicial,
      dataFinal
    } = req.query

    const haveService = await this.verifyServiceExistsAndAble(String(serviceName))

    if (!haveService) {
      return res.status(406).json({
        message: 'serviço não é monitorado por nossa base de dados ou não está habilitado'
      })
    }

    const serviceURL = this.makeUrl(String(serviceName))
    const lastSevenDaysDate = moment().subtract(7, 'days').format('YYYY-MM-DD')

    const changes = await downDetectorChangeRepository.index({
      initialDate: !!dataInicial ? String(dataInicial) : lastSevenDaysDate,
      finalDate: !!dataFinal ? String(dataFinal) : '',
    })

    const changesData = changes.map((change) => {
      return {
        date: moment(change.hist_date).format('YYYY-MM-DD HH:mm:ss'),
        change: this.convertChangeStatusToString(change.status_change)
      }
    })

    const data = {
      quantidade_de_mudancas: changes.length,
      data: changesData
    }

    return res.status(200).json({
      ...data
    })
  }
}