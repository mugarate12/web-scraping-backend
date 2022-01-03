import auth from "./authJWT"
import createApiClientsMiddleware from "./createApiClients"
import createService from './createServices'
import createUser from "./createUser"
import publicAccessJWTMiddleware from "./publicAccessJWT"
import readServices from './readServices'
import readUsers from './readUsersInformations'
import userReadApiInformations from "./userReadApiInformations"
import viewApiInformations from "./viewApiInformations"
import viewFlow4DetectorInformation from "./viewFlow4DetectorInformation"
import viewFlow4EnergyInformation from "./viewFlow4EnergyInformations"

export const authJWT = auth
export const createApiClients = createApiClientsMiddleware
export const createUserPermission = createUser
export const createServicePermission = createService
export const publicAccessJWT = publicAccessJWTMiddleware
export const readUsersPermission = readUsers
export const readServicesPermission = readServices
export const readApiInformationByUser = userReadApiInformations
export const readApiInformations = viewApiInformations
export const readFlow4DetectorInformation = viewFlow4DetectorInformation
export const readFlow4EnergyInformation = viewFlow4EnergyInformation