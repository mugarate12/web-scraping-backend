import ApiAccessController from "./apiAccessController"
import CPFLController from "./CPFLController"
import CPFLSearchController from "./CPFLSearchController"
import DownDetectorController from "./downDetector"
import EquatorialController from "./EquatorialController"
import ServicesController from "./servicesController"
import SessionController from "./sessionController"
import UsersController from "./usersController"

export const apiAccessController = new ApiAccessController()
export const cpflController = new CPFLController()
export const cpflSearchController = new CPFLSearchController()
export const downDetectorController = new DownDetectorController()
export const equatorialController = new EquatorialController()
export const servicesController = new ServicesController()
export const sessionController = new SessionController()
export const usersController = new UsersController()
