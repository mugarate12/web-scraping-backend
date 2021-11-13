import jwt from 'jsonwebtoken'
import { Request, Response, NextFunction } from 'express'

import { AppError, errorHandler } from './../utils/handleError'

const JWT_SECRET = process.env.JWT_SECRET || 'Secret'

interface decodedTokenInterface {
  id: string;
}

export default async function publicAccessJWT(req: Request, res: Response, next: NextFunction) {
  const authToken = req.query.token

  if (!authToken) {
    return errorHandler(new AppError('Authorization Error', 401, 'Token não fornecido', true), res)
  }

  try {
    return await jwt.verify(authToken, JWT_SECRET, (error, decoded) => {
      if (error) {
        return errorHandler(new AppError('Authorization Error', 401, 'Não autorizado ou token inválido', true), res)
      }

      res.setHeader('userID', decoded?.id)
      return next()
    })
  } catch (error) {
    return errorHandler(new AppError('Authorization Error', 401, 'Não autorizado ou token inválido', true), res)
  }
}