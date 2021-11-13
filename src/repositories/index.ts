import ApiAccessClientsRepository from './api_access_clients'
import ApiAccessTokensRepository from './api_access_tokens'
import ClientsAccessRepository from './clientsAccessRepository'
import DownDetectorChangeRepository from './downDetectorChangeRepository'
import DownDetectorHistRepository from "./downDetectorHistRepository"
import MonitoringRepository from "./monitoringRepository"
import PermissionsRepository from './permissionsRepository'
import ServicesRepository from "./servicesRepository"
import ServicesUpdateTimeRepository from './servicesUpdateTimeRepository'
import UsersAccessRepository from './usersAccessRepository'
import UsersRepository from './usersRepository'

export const apiAccessClientsRepository = new ApiAccessClientsRepository()
export const apiAccessTokensRepository = new ApiAccessTokensRepository()
export const clientsAccessRepository = new ClientsAccessRepository()
export const downDetectorChangeRepository = new DownDetectorChangeRepository()
export const downDetectorHistRepository = new DownDetectorHistRepository()
export const monitoringRepository = new MonitoringRepository()
export const permissionsRepository = new PermissionsRepository()
export const servicesRepository = new ServicesRepository()
export const servicesUpdateTimeRepository = new ServicesUpdateTimeRepository()
export const usersAccessRepository = new UsersAccessRepository()
export const usersRepository = new UsersRepository()
