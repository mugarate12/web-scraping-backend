import { Request, Response } from 'express'
import moment from 'moment'
import dotenv from 'dotenv'

dotenv.config()

import {
  downDetectorController
} from './../controllers'

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

  private createArrayOfDates = ({
    initialDate,
    finalDate,
    numberOfDays
  }: {
    initialDate?: string,
    finalDate?: string,
    numberOfDays?: number
  }) => {
    let dates: Array<string> = []
    let subtractDays = !!numberOfDays ? numberOfDays : 3

    const initial = !!initialDate ? moment(initialDate) : moment().subtract(subtractDays, 'days')
    const final = !!finalDate ? moment(finalDate) : moment()

    let addDays = 1
    let dateMoreDays = initial

    while (dateMoreDays.format('YYYY-MM-DD') !== final.format('YYYY-MM-DD')) {
      dates.push(dateMoreDays.format('YYYY-MM-DD'))

      dateMoreDays = initial.add(addDays, 'days')
    }

    dates.push(final.format('YYYY-MM-DD'))

    return dates
  }

  private convertDate = (date: any) => {
    const envToConvertDate = Number(process.env.CONVERT_HOURS) === 1

    if (envToConvertDate) {
      return moment(date).subtract(3, 'hours').format('DD-MM-YYYY HH:mm:ss')
    } else {
      return moment(date).format('DD-MM-YYYY HH:mm:ss')
    }
  }

  private allServicesStatus = async () => {
    const services = await servicesRepository.index({
      habilitado: 1
    })

    const dataRequests = services.map(async (service) => {
      const serviceURL = this.makeUrl(service.service_name)
      // await downDetectorController.accessDownDetectorSingleUpdateNotRoute(service.service_name)

      const lastRegistryOfHistory = await downDetectorHistRepository.index({
        serviceURL: serviceURL,
        orderBy: { property: 'id', orientation: 'desc' },
        limit: 1,
        dates: []
      })

      const lastRegistryOfChange = await downDetectorChangeRepository.index({
        identifiers: { serviceURL: serviceURL },
        orderBy: { property: 'id', orientation: 'desc' },
        limit: 1
      })

      if (lastRegistryOfHistory.length === 0) {
        return undefined
      }

      const status = this.convertStatusToString(lastRegistryOfChange[0].status_atual)
      const baseline = lastRegistryOfHistory[0].baseline
      const reports = lastRegistryOfHistory[0].notification_count
      const date = this.convertDate(lastRegistryOfHistory[0].hist_date)
      // const date = moment(lastRegistryOfHistory[0].hist_date).format('DD-MM-YYYY HH:mm:ss')

      return {
        name: service.service_name,
        date,
        status,
        baseline,
        reports
      }
    })

    const servicesStatus = await Promise.all(dataRequests)
    const data = servicesStatus.filter((service) => !!service)
    return data
  }

  private allServicesHistory = async () => {
    const services = await servicesRepository.index({
      habilitado: 1
    })
    
    const dates = this.createArrayOfDates({
      numberOfDays: 1
    })

    const historiesRequests = services.map(async (service) => {
      const serviceURL = this.makeUrl(service.service_name)
      // await downDetectorController.accessDownDetectorSingleUpdateNotRoute(service.service_name)
      
      const lastRegistryOfChange = await downDetectorChangeRepository.index({
        identifiers: { serviceURL: serviceURL },
        orderBy: { property: 'id', orientation: 'desc' },
        limit: 1
      })

      const histories = await downDetectorHistRepository.index({
        serviceURL,
        dates
      })

      const status = this.convertStatusToString(lastRegistryOfChange[0].status_atual)
      const reportsAndBaselines = histories.map((history) => {
        return {
          // date: moment(history.hist_date).format('YYYY-MM-DD HH:mm:ss'),
          date: this.convertDate(history.hist_date),
          reports: history.notification_count,
          baseline: history.baseline
        }
      })

      return {
        service: serviceURL,
        status,
        data: reportsAndBaselines
      }
    })

    const data = await Promise.all(historiesRequests)

    return data
  }

  private allServicesChanges = async () => {
    const services = await servicesRepository.index({
      habilitado: 1
    })
    
    const dates = this.createArrayOfDates({
      numberOfDays: 1
    })

    const changesRequests = services.map(async (service) => {
      const serviceURL = this.makeUrl(service.service_name)
      // await downDetectorController.accessDownDetectorSingleUpdateNotRoute(service.service_name)

      const changes = await downDetectorChangeRepository.index({
        dates,
        identifiers: {
          serviceURL
        }
      })

      const changesData = changes.map((change) => {
        return {
          // date: moment(change.hist_date).format('YYYY-MM-DD HH:mm:ss'),
          date: this.convertDate(change.hist_date),
          change: this.convertChangeStatusToString(change.status_change)
        }
      })

      const data = {
        service: serviceURL,
        quantidade_de_mudancas: changes.length,
        data: changesData
      }

      return data
    })

    const data = await Promise.all(changesRequests)
    return data
  }

  private verifyClientAble = async (res: Response) => {
    const userID = Number(res.getHeader('userID'))

    return await apiAccessClientsRepository.get({
      id: userID
    })
      .then(response => {
        if (response.able === 2) {
          return res.status(406).json({
            message: 'cliente está desabilitado, por favor, entre em contato com o administrador do sistema'
          })
        }
      })
      .catch(error => {
        console.log(error)
      })
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
  
  public update = async (req: Request, res: Response) => {
    const { clientID } = req.params
    const {
      identifier,
      able
    } = req.body

    return await apiAccessClientsRepository.update({
      identifiers: {
        id: Number(clientID)
      },
      payload: {
        identifier: identifier !== undefined ? String(identifier) : '',
        able: able !== undefined ? Number(able) : undefined
      }
    })
      .then(() => {
        return res.status(201).json({
          message: 'api access clients atualizado com sucesso!'
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

    this.verifyClientAble(res)

    if (String(serviceName) === 'all') {
      const data = await this.allServicesStatus()
      return res.status(200).json({
        data: data
      })
    }

    const haveService = await this.verifyServiceExistsAndAble(String(serviceName))

    if (!haveService) {
      return res.status(406).json({
        message: 'serviço não é monitorado por nossa base de dados ou não está habilitado'
      })
    }

    const serviceURL = this.makeUrl(String(serviceName))
    // await downDetectorController.accessDownDetectorSingleUpdateNotRoute(String(serviceName))

    const lastRegistryOfChange = await downDetectorChangeRepository.index({
      identifiers: { serviceURL: serviceURL },
      orderBy: { property: 'id', orientation: 'desc' },
      limit: 1
    })

    const lastRegistryOfHistory = await downDetectorHistRepository.index({
      serviceURL: serviceURL,
      orderBy: { property: 'hist_date', orientation: 'desc' },
      limit: 1,
      dates: []
    })

    if (lastRegistryOfChange.length === 0 || lastRegistryOfHistory.length === 0) {      
      return res.status(406).json({
        message: 'aguarde o serviço começar a ser atualizado por nossas rotinas'
      })
    }

    const status = this.convertStatusToString(lastRegistryOfChange[0].status_atual)
    const baseline = lastRegistryOfHistory[0].baseline
    const reports = lastRegistryOfHistory[0].notification_count
    // const date = moment(lastRegistryOfHistory[0].hist_date).subtract(3, 'hours').format('DD-MM-YYYY HH:mm:ss')
    // const date = moment(lastRegistryOfHistory[0].hist_date).format('DD-MM-YYYY HH:mm:ss')
    const date = this.convertDate(lastRegistryOfHistory[0].hist_date)

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

    this.verifyClientAble(res)

    if (String(serviceName) === 'all') {
      const data = await this.allServicesHistory()

      return res.status(200).json({
        data
      })
    }

    const haveService = await this.verifyServiceExistsAndAble(String(serviceName))

    if (!haveService) {
      return res.status(406).json({
        message: 'serviço não é monitorado por nossa base de dados ou não está habilitado'
      })
    }

    const serviceURL = this.makeUrl(String(serviceName))
    // await downDetectorController.accessDownDetectorSingleUpdateNotRoute(String(serviceName))

    const dates = this.createArrayOfDates({
      initialDate: !!dataInicial ? String(dataInicial) : '',
      finalDate: !!dataFinal ? String(dataFinal) : '',
    })

    const lastRegistryOfChange = await downDetectorChangeRepository.index({
      identifiers: { serviceURL: serviceURL },
      orderBy: { property: 'id', orientation: 'desc' },
      limit: 1
    })

    const histories = await downDetectorHistRepository.index({
      serviceURL,
      dates,
      orderBy: {
        property: 'hist_date',
        orientation: 'desc'
      }
    })
     
    const status = this.convertStatusToString(lastRegistryOfChange[0].status_atual)
    const reportsAndBaselines = histories.map((history) => {
      return {
        // date: moment(history.hist_date).format('YYYY-MM-DD HH:mm:ss'),
        date: this.convertDate(history.hist_date),
        reports: history.notification_count,
        baseline: history.baseline
      }
    })

    const reportsAndBaselinesWithoutLowerValues = reportsAndBaselines.filter(history => history.reports !== 0)
    let historiesData: Array<any> = []

    reportsAndBaselinesWithoutLowerValues.forEach(history => {
      let have = false
      
      historiesData.forEach(historyData => {
        const sameHour = historyData.date.includes(history.date.split(':')[0])
        const sameReportAndBaseline = historyData.baseline === history.baseline && history.reports === historyData.reports
        
        if (sameHour && sameReportAndBaseline) {
          have = true
        }
      })

      if (!have) {
        historiesData.push(history)
      }
    })

    const data = {
      status,
      data: historiesData
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

    this.verifyClientAble(res)

    if (String(serviceName) === 'all') {
      const data = await this.allServicesChanges()
      return res.status(200).json({
        data
      })
    }

    const haveService = await this.verifyServiceExistsAndAble(String(serviceName))

    if (!haveService) {
      return res.status(406).json({
        message: 'serviço não é monitorado por nossa base de dados ou não está habilitado'
      })
    }

    const serviceURL = this.makeUrl(String(serviceName))
    // await downDetectorController.accessDownDetectorSingleUpdateNotRoute(String(serviceName))

    const dates = this.createArrayOfDates({
      initialDate: !!dataInicial ? String(dataInicial) : '',
      finalDate: !!dataFinal ? String(dataFinal) : '',
    })

    const changes = await downDetectorChangeRepository.index({
      dates,
      identifiers: {
        serviceURL
      }
    })

    const changesData = changes.map((change) => {
      return {
        // date: moment(change.hist_date).format('YYYY-MM-DD HH:mm:ss'),
        date: this.convertDate(change.hist_date),
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