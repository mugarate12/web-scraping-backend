import { Router } from 'express'
import { celebrate, Joi, Segments } from 'celebrate'

import {
  sessionController
} from './../controllers'

export default function sessionRoutes(routes: Router) {
  routes.post('/session', celebrate({
    [Segments.BODY]: Joi.object().keys({
      login: Joi.string().required(),
      password: Joi.string().required()
    })
  }), sessionController.create)
}