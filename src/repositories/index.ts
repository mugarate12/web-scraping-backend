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

import EnergisaDataRepository from './EnergisaDataRepository'
import EnergisaInformationsRepository from './EnergisaInformationsRepository'

import EnergyPermissionsRepository from './EnergyPermissionsRepository'

import EquatorialDataRepository from './EquatorialDataRepository'

import HostsPerfilsRepository from './HostsPerfilsRepository'

import MonitoringRepository from "./monitoringRepository"

import OCRDataRepository from './OCRDataRepository'
import OCRPermissionsRepository from './OCRPermissionsRepository'
import OCRServicesRepository from './OCRServicesRepository'

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
export const energisaDataRepository = new EnergisaDataRepository()
export const energisaInformationsRepository = new EnergisaInformationsRepository()
export const energyPermissionsRepository = new EnergyPermissionsRepository()
export const equatorialDataRepository = new EquatorialDataRepository()
export const hostsPerfilsRepository = new HostsPerfilsRepository()
export const monitoringRepository = new MonitoringRepository()
export const ocrDataRepository = new OCRDataRepository()
export const ocrPermissionsRepository = new OCRPermissionsRepository()
export const ocrServicesRepository = new OCRServicesRepository()
export const permissionsRepository = new PermissionsRepository()
export const servicesRepository = new ServicesRepository()
export const servicesUpdateTimeRepository = new ServicesUpdateTimeRepository()
export const usersAccessRepository = new UsersAccessRepository()
export const usersRepository = new UsersRepository()
