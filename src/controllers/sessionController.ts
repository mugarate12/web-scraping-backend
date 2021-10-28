import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'

import {
  usersRepository
} from './../repositories'
import { errorHandler, AppError } from './../utils/handleError'
import createToken from './../utils/createToken'

export default class SessionController {
  public create = async (req: Request, res: Response) => {
    const {
      login,
      password
    } = req.body
    
    const user = await usersRepository.get({ login: String(login) })
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
      const token = createToken(user.id)

      return res.status(201).json({
        token,
        message: 'usuário logado com sucesso!'
      })
    }
  }
}