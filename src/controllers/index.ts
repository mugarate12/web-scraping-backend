import ApiAccessController from "./apiAccessController"
import CPFLController from "./CPFLController"
import CPFLSearchController from "./CPFLSearchController"
import DownDetectorController from "./downDetector"
import EnergisaController from "./EnergisaController"
import EquatorialController from "./EquatorialController"
import HostPerfisController from "./HostPerfisController"
import NFSEFazendaController from "./NFEFazendaController"
import OCRController from "./OCRController"
import ServicesController from "./servicesController"
import SessionController from "./sessionController"
import UsersController from "./usersController"
import ZabbixController from "./ZabbixController"

export const apiAccessController = new ApiAccessController()
export const cpflController = new CPFLController()
export const cpflSearchController = new CPFLSearchController()
export const downDetectorController = new DownDetectorController()
export const energisaController = new EnergisaController()
export const equatorialController = new EquatorialController()
export const hostPerfisController = new HostPerfisController()
export const nfseFazendaController = new NFSEFazendaController()
export const ocrController = new OCRController()
export const servicesController = new ServicesController()
export const sessionController = new SessionController()
export const usersController = new UsersController()
export const zabbixController = new ZabbixController()
