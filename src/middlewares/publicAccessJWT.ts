import jwt from 'jsonwebtoken'
import { Request, Response, NextFunction } from 'express'
import dotenv from 'dotenv'

import {
  apiAccessClientsRepository
} from './../repositories'

import { AppError, errorHandler } from './../utils/handleError'

dotenv.config()

const JWT_SECRET = process.env.JWT_SECRET || 'Secret'

interface decodedTokenInterface {
  id: string;
}

// 'cliente está desabilitado, por favor, entre em contato com o administrador do sistema'

export default async function publicAccessJWT(req: Request, res: Response, next: NextFunction) {
  const authToken = req.query.token

  if (!authToken) {
    return errorHandler(new AppError('Authorization Error', 401, 'Token não fornecido', true), res)
  }

  try {
    return await jwt.verify(authToken, JWT_SECRET, async (error, decoded) => {
      if (error) {
        return errorHandler(new AppError('Authorization Error', 401, 'Não autorizado ou token inválido', true), res)
      }
      
      let haveAccess = await apiAccessClientsRepository.get({
        id: Number(decoded?.id)
      })
        .then(response => {
          if (response.able === 2) {
            // res.status(406).json({
            //   message: 'cliente está desabilitado, por favor, entre em contato com o administrador do sistema'
            // })
  
            return false
          } else {
            return true
          }
        })
        .catch(error => {
          console.log(error)
        
          return false
        })

      if (!haveAccess) {
        return errorHandler(new AppError('Authorization Error', 406, 'cliente está desabilitado ou não existe, por favor, entre em contato com o administrador do sistema', true), res)
      }

      res.setHeader('userID', decoded?.id)
      return next()
    })
  } catch (error) {
    return errorHandler(new AppError('Authorization Error', 401, 'Não autorizado ou token inválido', true), res)
  }
}