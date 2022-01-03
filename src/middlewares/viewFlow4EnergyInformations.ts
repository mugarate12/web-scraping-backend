import { Request, Response, NextFunction } from 'express'

import { AppError, errorHandler } from './../utils/handleError'

import {
  clientsAccessRepository,
  permissionsRepository
} from './../repositories'

export default async function viewFlow4EnergyInformation(req: Request, res: Response, next: NextFunction) {
  const userID = Number(res.getHeader('userID'))

  const permission = await permissionsRepository.get({
    identifier: 'ACCESS_API_FLOW4ENERGY_DATA'
  })

  const apiAccess = await clientsAccessRepository.get({
    client_FK: userID,
    permission_FK: permission.id
  })

  if (!apiAccess) {
    return errorHandler(new AppError('Authorization Error', 401, 'Não autorizado ou token inválido', true), res)
  } else {
    return next()
  }
}