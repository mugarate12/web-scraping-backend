import { Router } from 'express'
import { celebrate, Joi, Segments } from 'celebrate'

import {
  apiAccessController,
  cpflController
} from './../controllers'

import {
  authJWT,
  createApiClients,
  publicAccessJWT,
  readApiInformationByUser,
  readApiInformations
} from './../middlewares'

export default function publicAccessRoutes(routes: Router) {
  routes.post('/public/create', celebrate({
    [Segments.BODY]: Joi.object().keys({
      identifier: Joi.string().required()
    })
  }), authJWT, createApiClients, apiAccessController.create)

  routes.get('/public/', authJWT, readApiInformationByUser, apiAccessController.index)

  routes.put('/public/update/:clientID', celebrate({
    [Segments.PARAMS]: Joi.object().keys({
      clientID: Joi.number().required()
    }),
    [Segments.BODY]: Joi.object().keys({
      identifier: Joi.string().optional(),
      able: Joi.number().optional()
    })
  }), authJWT, createApiClients, apiAccessController.update)

  routes.delete('/public/:identifier', celebrate({
    [Segments.PARAMS]: Joi.object().keys({
      identifier: Joi.string().required()
    })
  }), authJWT, createApiClients, apiAccessController.delete)

  routes.get('/public/access/status/:serviceName', celebrate({
    [Segments.QUERY]: Joi.object().keys({
      token: Joi.string().required()
    })
  }), publicAccessJWT, readApiInformations, apiAccessController.status)

  routes.get('/public/access/changes/:serviceName', celebrate({
    [Segments.QUERY]: Joi.object().keys({
      token: Joi.string().required()
    })
  }), publicAccessJWT, readApiInformations, apiAccessController.changes)

  routes.get('/public/access/cpfl/:state', celebrate({
    [Segments.PARAMS]: Joi.object().keys({
      state: Joi.string().required()
    })
  }), cpflController.getCPFLStateJson)
  
  routes.get('/public/access/cpfl/:state/:city', celebrate({
    [Segments.PARAMS]: Joi.object().keys({
      state: Joi.string().required(),
      city: Joi.string().required()
    })
  }), cpflController.getCPFLCityJson)
} 