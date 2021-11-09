import DownDetectorChangeRepository from './downDetectorChangeRepository'
import DownDetectorHistRepository from "./downDetectorHistRepository"
import MonitoringRepository from "./monitoringRepository"
import ServicesRepository from "./servicesRepository"
import ServicesUpdateTimeRepository from './servicesUpdateTimeRepository'
import UsersRepository from './usersRepository'

export const downDetectorChangeRepository = new DownDetectorChangeRepository()
export const downDetectorHistRepository = new DownDetectorHistRepository()
export const monitoringRepository = new MonitoringRepository()
export const servicesRepository = new ServicesRepository()
export const servicesUpdateTimeRepository = new ServicesUpdateTimeRepository()
export const usersRepository = new UsersRepository()
