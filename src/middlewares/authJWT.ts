import jwt from 'jsonwebtoken'
import { Request, Response, NextFunction } from 'express'

import { AppError, errorHandler } from './../utils/handleError'

const JWT_SECRET = process.env.JWT_SECRET || 'Secret'

interface decodedTokenInterface {
  id: string;
}

export default async function authJWT(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization

  if (!authHeader) {
    return errorHandler(new AppError('Authorization Error', 401, 'Token não fornecido', true), res)
  }

  const [schema, token] = authHeader.split(' ')

  try {
    // const decoded: any = await promisify(jwt.verify)(token, JWT_SECRET)
    // const idUserByToken = decoded.id
    return await jwt.verify(token, JWT_SECRET, (error, decoded) => {
      if (error) {
        return errorHandler(new AppError('Authorization Error', 401, 'Não autorizado ou token inválido', true), res)
      }

      res.setHeader('userID', decoded?.id)
      return next()
    })
  } catch (err) {
    return errorHandler(new AppError('Authorization Error', 401, 'Não autorizado ou token inválido', true), res)
  }
}