import DownDetectorChangeRepository from './downDetectorChangeRepository'
import DownDetectorHistRepository from "./downDetectorHistRepository"
import MonitoringRepository from "./monitoringRepository"
import ServicesRepository from "./servicesRepository"

export const downDetectorChangeRepository = new DownDetectorChangeRepository()
export const downDetectorHistRepository = new DownDetectorHistRepository()
export const monitoringRepository = new MonitoringRepository()
export const servicesRepository = new ServicesRepository()
