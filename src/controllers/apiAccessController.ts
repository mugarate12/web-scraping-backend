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
  energyPermissionsRepository,
  servicesRepository,
  permissionsRepository,
  cpflSearchRepository
} from './../repositories'
import { permissionsInterface } from './../repositories/permissionsRepository'

import { errorHandler, AppError } from './../utils/handleError'
import createToken from '../utils/createToken'

type permissionsArray = Array<{
  dealership: string,
  state: string,
  city: string
}>

export default class ApiAccessController {
  private makeUrl = (service: string) => {
    const url = `https://downdetector.com/status/${service}`

    return url
  }

  private convertStatusToString = (status: number, serviceName: string) => {
    // initial value = 0
    // warning = 1 
    // danger = 2
    // success = 3

    if (status === 1) {
      // const message = `Relatos de usuários indicam potenciais problemas com ${serviceName}`
      return 3
    } else if (status === 2) {
      // const message = `Relatórios de usuários indicam problemas com ${serviceName}`
      return 4
    } else if (status === 3){
      // const message = `Relatos de usuários indicam que não há problemas atuais com ${serviceName}`
      return 2
    }  else {
      return 5
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

      const status = this.convertStatusToString(lastRegistryOfChange[0].status_atual, service.service_name)
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
        dates: [ moment().format('YYYY-MM-DD') ],
        identifiers: {
          serviceURL
        },
        orderBy: {
          property: 'hist_date',
          orientation: 'desc'
        }
      })

      const changesData = changes.map((change) => {
        return {
          // date: moment(change.hist_date).format('YYYY-MM-DD HH:mm:ss'),
          dateUnix: Number(change.dateUnixTime),
          date: this.convertDate(change.hist_date),
          change: this.convertChangeStatusToString(change.status_change)
        }
      })

      const data = {
        name: service.service_name,
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
          res.status(406).json({
            message: 'cliente está desabilitado, por favor, entre em contato com o administrador do sistema'
          })

          return true
        } else {
          return false
        }
      })
      .catch(error => {
        console.log(error)
      
        return false
      })
  }

  public create = async (req: Request, res: Response) => {
    const {
      identifier,
      flow4Energy,
      flow4Detector
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

    const permissionToFlow4Detector = await permissionsRepository.get({
      identifier: 'ACCESS_API_FLOW4DETECTOR_DATA'
    })

    const permissionToFlow4Energy = await permissionsRepository.get({
      identifier: 'ACCESS_API_FLOW4ENERGY_DATA'
    })

    let permissionsIDS = [ permissionToViewData.id ]

    if (!!flow4Detector) {
      permissionsIDS.push(permissionToFlow4Detector.id)
    }
    
    if (!!flow4Energy) {
      permissionsIDS.push(permissionToFlow4Energy.id)
    }

    await clientsAccessRepository.create({
      client_FK: Number(clientID),
      permissions: permissionsIDS
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

  public getPermissions = async (req: Request, res: Response) => {
    const { clientID } = req.params

    const clientsAccess = await clientsAccessRepository.index(Number(clientID))
    
    let permissions: Array<string> = []
    for (let index = 0; index < clientsAccess.length; index++) {
      const clientAccess = clientsAccess[index]
      
      await permissionsRepository.get({ id: clientAccess.permission_FK })
        .then(permission => {
          if (!!permission) {
            permissions.push(permission.identifier)
          }
        })
    }

    return res.status(200).json({
      data: permissions
    })
  }

  private setFlow4Detector = async (key: boolean, permissionsIDS: number[], clientID: number, permission: permissionsInterface) => {
    if (!!key) {
      const havePermission = await clientsAccessRepository.get({
        client_FK: Number(clientID),
        permission_FK: permission.id
      })
      .then(client => client)

      if (!havePermission) {
        permissionsIDS.push(permission.id)
      }
    } else {
      await clientsAccessRepository.delete({ 
        client_FK: Number(clientID),
        permission_FK: permission.id
      })
    }
  }
  
  private setFlow4Energy = async (key: boolean, permissionsIDS: number[], clientID: number, permission: permissionsInterface) => {
    if (!!key) {
      const havePermission = await clientsAccessRepository.get({
        client_FK: Number(clientID),
        permission_FK: permission.id
      })
      .then(client => client)

      if (!havePermission) {
        permissionsIDS.push(permission.id)
      }
    } else {
      await clientsAccessRepository.delete({ 
        client_FK: Number(clientID),
        permission_FK: permission.id
      })
    }
  }
  
  public update = async (req: Request, res: Response) => {
    const { clientID } = req.params
    const {
      identifier,
      able,
      flow4Energy,
      flow4Detector,
      permissionsArray
    } = req.body

    const permissionToFlow4Detector = await permissionsRepository.get({
      identifier: 'ACCESS_API_FLOW4DETECTOR_DATA'
    })

    const permissionToFlow4Energy = await permissionsRepository.get({
      identifier: 'ACCESS_API_FLOW4ENERGY_DATA'
    })

    let permissionsIDS: Array<number> = []
    if (!!flow4Detector) {
      const havePermission = await clientsAccessRepository.get({
        client_FK: Number(clientID),
        permission_FK: permissionToFlow4Detector.id
      })
      .then(client => client)

      if (!havePermission) {
        permissionsIDS.push(permissionToFlow4Detector.id)
      }
    } else {
      await clientsAccessRepository.delete({ 
        client_FK: Number(clientID),
        permission_FK: permissionToFlow4Detector.id
      })
    }
    
    if (!!flow4Energy) {
      const havePermission = await clientsAccessRepository.get({
        client_FK: Number(clientID),
        permission_FK: permissionToFlow4Energy.id
      })
      .then(client => client)

      if (!havePermission) {
        permissionsIDS.push(permissionToFlow4Energy.id)
      }
    } else {
      await clientsAccessRepository.delete({ 
        client_FK: Number(clientID),
        permission_FK: permissionToFlow4Energy.id
      })
    }

    await clientsAccessRepository.create({
      client_FK: Number(clientID),
      permissions: permissionsIDS
    })
      .catch(error => {
        console.log('erro ao criar permissão')
      })

    
    const requests = permissionsArray.map(async (permission: {
      dealership: string,
      state: string,
      city: string
    }) => {
      const search = await cpflSearchRepository.get({
        dealership: permission.dealership,
        state: permission.state,
        city: permission.city
      })

      if (!!search) {
        await energyPermissionsRepository.create({
          cpfl_search_FK: search.id,
          client_FK: Number(clientID)
        })
      }
    })
    await Promise.all(requests)

    
    await apiAccessClientsRepository.update({
      identifiers: {
        id: Number(clientID)
      },
      payload: {
        identifier: identifier !== undefined ? String(identifier) : '',
        able: able !== undefined ? Number(able) : undefined
      }
    })
      .catch(error => {
        // console.log(error)
      })

    return res.status(201).json({
      message: 'api access clients atualizado com sucesso!'
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

    const result = await this.verifyClientAble(res)
    if (!!result) {
      return
    }

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

    const status = this.convertStatusToString(lastRegistryOfChange[0].status_atual, String(serviceName))
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

  public changes = async (req: Request, res: Response) => {
    const {
      serviceName
    } = req.params

    const result = await this.verifyClientAble(res)
    if (!!result) {
      return
    }

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

    const changes = await downDetectorChangeRepository.index({
      dates: [ moment().format('YYYY-MM-DD') ],
      identifiers: {
        serviceURL
      },
      orderBy: {
        property: 'hist_date',
        orientation: 'desc'
      }
    })

    const changesData = changes.map((change) => {
      return {
        // date: moment(change.hist_date).format('YYYY-MM-DD HH:mm:ss'),
        dateUnix: Number(change.dateUnixTime),
        date: this.convertDate(change.hist_date),
        change: this.convertChangeStatusToString(change.status_change)
      }
    })

    const data = {
      site: String(serviceName),
      quantidade_de_mudancas: changes.length,
      data: changesData
    }

    return res.status(200).json({
      ...data
    })
  }
}