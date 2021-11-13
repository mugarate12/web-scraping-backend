import { Request, Response, NextFunction } from 'express'

import { AppError, errorHandler } from './../utils/handleError'

import {
  permissionsRepository,
  usersAccessRepository
} from './../repositories'

export default async function userReadApiInformations(req: Request, res: Response, next: NextFunction) {
  const userID = Number(res.getHeader('userID'))

  const permission = await permissionsRepository.get({
    identifier: 'ACCESS_API_ACCESS_VIEW'
  })

  const userAccess = await usersAccessRepository.get({
    user_FK: userID,
    permission_FK: permission.id
  })

  if (!userAccess) {
    return errorHandler(new AppError('Authorization Error', 401, 'Não autorizado ou token inválido', true), res)
  } else {
    return next()
  }
}