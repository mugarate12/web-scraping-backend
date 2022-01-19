import ApiAccessClientsRepository from './api_access_clients'
import ApiAccessTokensRepository from './api_access_tokens'
import ClientsAccessRepository from './clientsAccessRepository'
import CPFLDataRepository from "./CPFLDataRepository"
import CPFLSearchNowRepository from './CPFLSearchNowRepository'
import CPFLSearchRepository from "./CPFLSearchRepository"
import CPFLSearchUpdateTimeRepository from './CPFLSearchUpdateTimeRepository'
import DownDetectorChangeRepository from './downDetectorChangeRepository'
import DownDetectorHistRepository from "./downDetectorHistRepository"
import DownDetectorRoutineExecutionRepository from './downDetectorRoutineExecution'
import EnergyPermissionsRepository from './EnergyPermissionsRepository'
import EquatorialDataRepository from './EquatorialDataRepository'
import MonitoringRepository from "./monitoringRepository"
import OCRDataRepository from './OCRDataRepository'
import PermissionsRepository from './permissionsRepository'
import ServicesRepository from "./servicesRepository"
import ServicesUpdateTimeRepository from './servicesUpdateTimeRepository'
import UsersAccessRepository from './usersAccessRepository'
import UsersRepository from './usersRepository'

export const apiAccessClientsRepository = new ApiAccessClientsRepository()
export const apiAccessTokensRepository = new ApiAccessTokensRepository()
export const clientsAccessRepository = new ClientsAccessRepository()
export const cpflDataRepository = new CPFLDataRepository()
export const cpflSearchNowRepository = new CPFLSearchNowRepository()
export const cpflSearchRepository = new CPFLSearchRepository()
export const cpflSearchUpdateTimeRepository = new CPFLSearchUpdateTimeRepository()
export const downDetectorChangeRepository = new DownDetectorChangeRepository()
export const downDetectorHistRepository = new DownDetectorHistRepository()
export const downDetectorRoutineExecutionRepository = new DownDetectorRoutineExecutionRepository()
export const energyPermissionsRepository = new EnergyPermissionsRepository()
export const equatorialDataRepository = new EquatorialDataRepository()
export const monitoringRepository = new MonitoringRepository()
export const ocrDataRepository = new OCRDataRepository()
export const permissionsRepository = new PermissionsRepository()
export const servicesRepository = new ServicesRepository()
export const servicesUpdateTimeRepository = new ServicesUpdateTimeRepository()
export const usersAccessRepository = new UsersAccessRepository()
export const usersRepository = new UsersRepository()
