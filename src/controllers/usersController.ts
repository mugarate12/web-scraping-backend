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

  public index = async (req: Request, res: Response) => {
    return await usersRepository.index({})
      .then(response => {
        return res.status(200).json({
          message: 'usuários recuperados com sucesso!',
          users: response
        })
      })
      .catch((err) => {
        return errorHandler(err, res)
      })
  }

  public update = async (req: Request, res: Response) => {
    const userID = Number(res.getHeader('userID'))
    const { password } = req.body
    const { id } = req.params

    return await usersRepository.update({
      identifiers: {
        id: Number(id)
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

    // const user = await usersRepository.get({ id: Number(id) })
    //   .then(user => user)
    //   .catch(error => {
    //     return undefined
    //   })

    // if (!user) {
    //   return errorHandler(
    //     new AppError('Erros de usuário', 406, 'usuário não encontrado', true),
    //     res
    //   )
    // }

    
    // if (bcrypt.compareSync(password, user.password)) {
      
    // }
  }

  public delete = async (req: Request, res: Response) => {
    const { userID } = req.params

    return usersRepository.delete({ id: Number(userID) })
      .then(() => {
        return res.status(200).json({
          message: 'usuário deletado com sucesso!'
        })
      })
      .catch((err) => {
        return errorHandler(err, res)
      })
  }
}