import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'

import {
  usersRepository,
  permissionsRepository,
  usersAccessRepository
} from './../repositories'
import { AppError, errorHandler } from './../utils/handleError'

export default class UsersController {
  private createPermissionsToUser = async (login: string, isAdmin: boolean) => {
    const permissions = await permissionsRepository.index()
    let permissionsIDs: Array<number> = []

    permissions.forEach((permission) => {
      const permissionToCreateServices = permission.identifier === 'ACCESS_SERVICES_CREATION'
      const permissionToCreateUsers = permission.identifier === 'ACCESS_USERS_CREATION'
      const permissionToApiAccessCreation = permission.identifier === 'ACCESS_API_ACCESS_CREATION'
      const isNotAdminPermissions = !permissionToCreateUsers && !permissionToCreateServices && !permissionToApiAccessCreation

      if ((permissionToCreateServices || permissionToCreateUsers || permissionToApiAccessCreation) && isAdmin) {
        permissionsIDs.push(permission.id)
      }

      if (isNotAdminPermissions) {
        permissionsIDs.push(permission.id)
      }
    })

    const user = await usersRepository.get({
      login: login
    })

    await usersAccessRepository.create({
      user_FK: user.id,
      permissions: permissionsIDs
    })
  }

  private updatePermissionsToUser = async (userID: number, isAdmin: boolean) => {
    const permissions = await permissionsRepository.index()
    let permissionsIDs: Array<number> = []

    permissions.forEach((permission) => {
      const permissionToCreateServices = permission.identifier === 'ACCESS_SERVICES_CREATION'
      const permissionToCreateUsers = permission.identifier === 'ACCESS_USERS_CREATION'
      const permissionToApiAccessCreation = permission.identifier === 'ACCESS_API_ACCESS_CREATION'
      const isNotAdminPermissions = !permissionToCreateUsers && !permissionToCreateServices && !permissionToApiAccessCreation

      if ((permissionToCreateServices || permissionToCreateUsers || permissionToApiAccessCreation) && isAdmin) {
        permissionsIDs.push(permission.id)
      }

      if (isNotAdminPermissions) {
        permissionsIDs.push(permission.id)
      }
    })

    await usersAccessRepository.update({
      user_FK: userID,
      permissions: permissionsIDs
    })
  }

  public create = async (req: Request, res: Response) => {
    const {
      login,
      password,
      isAdmin
    } = req.body

    const userCreation = await usersRepository.create({
      login,
      password
    })
      .then(() => {
        return true
      })
      .catch((error) => {
        return false
      })

    if (!userCreation) {
      return errorHandler(
        new AppError('Database Erro', 406, 'Usu??rio j?? existe', true),
        res
      )
    }

    await this.createPermissionsToUser(String(login), Boolean(isAdmin))

    return res.status(201).json({
      message: 'usu??rio criado com sucesso!'
    })
  }

  public index = async (req: Request, res: Response) => {
    return await usersRepository.index({})
      .then(response => {
        return res.status(200).json({
          message: 'usu??rios recuperados com sucesso!',
          users: response
        })
      })
      .catch((err) => {
        return errorHandler(err, res)
      })
  }

  public update = async (req: Request, res: Response) => {
    const userID = Number(res.getHeader('userID'))
    const { password, isAdmin } = req.body
    const { id } = req.params

    let haveError = false
    let errorName = ''
    let errorMessage = ''

    if (!!password) {
      await usersRepository.update({
        identifiers: {
          id: Number(id)
        },
        payload: {
          password: password
        }
      })
        .catch(error => {
          haveError = true
          errorName = 'Database Error'
          errorMessage = 'n??o foi poss??vel alterar senha, verifique as informa????es do usu??rio'
        })
    }

    if (String(isAdmin) !== 'undefined') {
      await this.updatePermissionsToUser(Number(id), Boolean(isAdmin))
    }

    if (haveError) {
      return errorHandler(
        new AppError(errorName, 403, errorMessage, true),
        res
      )
    } else {
      return res.status(200).json({
        message: 'usu??rio atualizado com sucesso!'
      })
    }
  }

  public delete = async (req: Request, res: Response) => {
    const { userID } = req.params

    await usersAccessRepository.delete({
      userID: Number(userID)
    })
      .catch(error => error)

    return usersRepository.delete({ id: Number(userID) })
      .then(() => {
        return res.status(200).json({
          message: 'usu??rio deletado com sucesso!'
        })
      })
      .catch((err) => {
        return errorHandler(err, res)
      })
  }
}