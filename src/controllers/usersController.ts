import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'

import {
  usersRepository
} from './../repositories'
import { AppError, errorHandler } from './../utils/handleError'

export default class UsersController {
  public create = async (req: Request, res: Response) => {
    const {
      login,
      password
    } = req.body

    return await usersRepository.create({
      login,
      password
    })
      .then(() => {
        return res.status(201).json({
          message: 'usuário criado com sucesso!'
        })
      })
      .catch((err) => {
        return errorHandler(err, res)
      })
  }

  public update = async (req: Request, res: Response) => {
    const userID = Number(res.getHeader('userID'))
    const { password } = req.body

    const user = await usersRepository.get({ id: userID })
      .then(user => user)
      .catch(error => {
        return undefined
      })

    if (!user) {
      return errorHandler(
        new AppError('Erros de usuário', 406, 'usuário não encontrado', true),
        res
      )
    }

    
    if (bcrypt.compareSync(password, user.password)) {
      return await usersRepository.update({
        identifiers: {
          id: userID
        },
        payload: {
          password: password
        }
      })
        .then(() => {
          return res.status(200).json({
            message: 'senha atualizada com sucesso!'
          })
        })
        .catch((err) => {
          return errorHandler(err, res)
        })

    }
  }
}