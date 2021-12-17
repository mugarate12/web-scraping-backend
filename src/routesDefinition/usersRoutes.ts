import { Router } from 'express'
import { celebrate, Joi, Segments } from 'celebrate'

import {
  usersController
} from './../controllers'

import {
  authJWT,
  createUserPermission,
  readUsersPermission
} from './../middlewares'

export default function userRoutes(routes: Router) {
  routes.post('/users', celebrate({
    [Segments.BODY]: Joi.object().keys({
      login: Joi.string().required(),
      password: Joi.string().required(),
      isAdmin: Joi.boolean().required()
    })
  }), authJWT, createUserPermission, usersController.create)
  
  routes.get('/users', readUsersPermission, usersController.index)
  
  routes.put('/users/:id', celebrate({
    [Segments.PARAMS]: Joi.object().keys({
      id: Joi.number().required()
    }),
    [Segments.BODY]: Joi.object().keys({
      password: Joi.string().optional(),
      isAdmin: Joi.boolean().optional()
    })
  }), authJWT, createUserPermission, usersController.update)
  
  routes.delete('/users/:userID', celebrate({
    [Segments.PARAMS]: Joi.object().keys({
      userID: Joi.number().required()
    })
  }), authJWT, createUserPermission, usersController.delete)
}