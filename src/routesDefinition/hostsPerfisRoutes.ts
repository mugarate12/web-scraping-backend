import { celebrate, Joi, Segments } from 'celebrate'
import { Router } from 'express'

import {
  hostPerfisController
} from './../controllers'

function hostsPerfisRoutes(routes: Router) {
  routes.post('/hostperfil', celebrate({
    [Segments.BODY]: Joi.object().keys({
      name: Joi.string().required(),
      user: Joi.string().required(),
      password: Joi.string().required(),
      url: Joi.string().required(),
      link: Joi.string().required()
    })
  }), hostPerfisController.create)

  routes.get('/hostperfil', hostPerfisController.index)

  routes.put('/hostperfil/:id', celebrate({
    [Segments.PARAMS]: Joi.object().keys({
      id: Joi.number().required()
    }),
    [Segments.BODY]: Joi.object().keys({
      name: Joi.string().optional(),
      user: Joi.string().optional(),
      password: Joi.string().optional(),
      url: Joi.string().optional(),
      link: Joi.string().optional()
    })
  }), hostPerfisController.update)

  routes.delete('/hostperfil/:id', celebrate({
    [Segments.PARAMS]: Joi.object().keys({
      id: Joi.number().required()
    })
  }), hostPerfisController.delete)
}

export default hostsPerfisRoutes