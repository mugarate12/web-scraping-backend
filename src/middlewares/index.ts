import auth from "./authJWT"
import createService from './createServices'
import createUser from "./createUser"
import readServices from './readServices'
import readUsers from './readUsersInformations'

export const authJWT = auth
export const createUserPermission = createUser
export const createServicePermission = createService
export const readUsersPermission = readUsers
export const readServicesPermission = readServices
