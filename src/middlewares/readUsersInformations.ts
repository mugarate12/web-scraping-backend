import { Request, Response, NextFunction } from 'express'

import { AppError, errorHandler } from './../utils/handleError'

import {
  permissionsRepository,
  usersAccessRepository
} from './../repositories'

export default async function readUsersInformations(req: Request, res: Response, next: NextFunction) {
  const userID = Number(res.getHeader('userID'))

  const permission = await permissionsRepository.get({
    identifier: 'ACCESS_USERS_VIEW'
  })

  const userAccess = await usersAccessRepository.get({
    permission_FK: permission.id
  })

  console.log(userAccess)

  if (!userAccess) {
    return errorHandler(new AppError('Authorization Error', 401, 'Não autorizado ou token inválido', true), res)
  } else {
    return next()
  }
}