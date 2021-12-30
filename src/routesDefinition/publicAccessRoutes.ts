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
    [Segments.QUERY]: Joi.object().keys({
      token: Joi.string().required()
    }),
    [Segments.PARAMS]: Joi.object().keys({
      state: Joi.string().required()
    })
  }), publicAccessJWT, readApiInformations, cpflController.getCPFLStateJson)
  
  routes.get('/public/access/cpfl/:state/:city', celebrate({
    [Segments.QUERY]: Joi.object().keys({
      token: Joi.string().required()
    }),
    [Segments.PARAMS]: Joi.object().keys({
      state: Joi.string().required(),
      city: Joi.string().required()
    })
  }), publicAccessJWT, readApiInformations, cpflController.getCPFLCityJson)

  routes.get('/public/access/cpfl/count/status/:state', celebrate({
    [Segments.QUERY]: Joi.object().keys({
      token: Joi.string().required(),
      bairro: Joi.string().optional(),
      rua: Joi.string().optional()
    })
  }), publicAccessJWT, readApiInformations, cpflController.getCountStatus)
  
  routes.get('/public/access/cpfl/count/causas/:state', celebrate({
    [Segments.QUERY]: Joi.object().keys({
      token: Joi.string().required(),
      bairro: Joi.string().optional(),
      rua: Joi.string().optional()
    })
  }), publicAccessJWT, readApiInformations, cpflController.getCountReasons)
} 