import ApiAccessController from "./apiAccessController"
import DownDetectorController from "./downDetector"
import ServicesController from "./servicesController"
import SessionController from "./sessionController"
import UsersController from "./usersController"

export const apiAccessController = new ApiAccessController()
export const downDetectorController = new DownDetectorController()
export const servicesController = new ServicesController()
export const sessionController = new SessionController()
export const usersController = new UsersController()
