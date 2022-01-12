import { Router } from 'express'
import { celebrate, Joi, Segments } from 'celebrate'

import {
  apiAccessController,
  cpflController,
  equatorialController
} from './../controllers'

import {
  authJWT,
  createApiClients,
  cpflEnergyPermissions,
  publicAccessJWT,
  readApiInformationByUser,
  readApiInformations,
  readFlow4DetectorInformation,
  readFlow4EnergyInformation
} from './../middlewares'

export default function publicAccessRoutes(routes: Router) {
  // CLIENTS ROUTES
  routes.post('/public/create', celebrate({
    [Segments.BODY]: Joi.object().keys({
      identifier: Joi.string().required(),
      expiration_time: Joi.string().required(),
      flow4Energy: Joi.boolean().optional(),
      flow4Detector: Joi.boolean().optional()
    })
  }), authJWT, createApiClients, apiAccessController.create)

  routes.get('/public/', authJWT, readApiInformationByUser, apiAccessController.index)

  routes.put('/public/update/:clientID', celebrate({
    [Segments.PARAMS]: Joi.object().keys({
      clientID: Joi.number().required()
    }),
    [Segments.BODY]: Joi.object().keys({
      identifier: Joi.string().optional(),
      expiration_time: Joi.string().optional(),
      able: Joi.number().optional(),
      flow4Energy: Joi.boolean().optional(),
      flow4Detector: Joi.boolean().optional(),
      permissionsArray: Joi.array().items({
        dealership: Joi.string().required(),
        state: Joi.string().required(),
        city: Joi.string().required()
      }).optional()
    })
  }), authJWT, createApiClients, apiAccessController.update)

  routes.put('/public/clienteKey/update/permissions/add/:clientID', celebrate({
    [Segments.PARAMS]: Joi.object().keys({
      clientID: Joi.number().required()
    }),
    [Segments.BODY]: Joi.object().keys({
      permissionsArray: Joi.array().items({
        dealership: Joi.string().required(),
        state: Joi.string().required(),
        city: Joi.string().required()
      }).optional()
    })
  }), authJWT, createApiClients, apiAccessController.addPermissions)
  
  routes.put('/public/clienteKey/update/permissions/remove/:clientID', celebrate({
    [Segments.PARAMS]: Joi.object().keys({
      clientID: Joi.number().required()
    }),
    [Segments.BODY]: Joi.object().keys({
      permissionsArray: Joi.array().items({
        dealership: Joi.string().required(),
        state: Joi.string().required(),
        city: Joi.string().required()
      }).optional()
    })
  }), authJWT, createApiClients, apiAccessController.removePermissions)


  routes.delete('/public/:identifier', celebrate({
    [Segments.PARAMS]: Joi.object().keys({
      identifier: Joi.string().required()
    })
  }), authJWT, createApiClients, apiAccessController.delete)

  routes.get('/public/client/permissions/:clientID', celebrate({
    [Segments.PARAMS]: Joi.object().keys({
      clientID: Joi.number().required()
    })
  }), authJWT, readApiInformationByUser, apiAccessController.getPermissions)

  // DOWN DETECTOR ROUTES
  routes.get('/public/access/status/:serviceName', celebrate({
    [Segments.QUERY]: Joi.object().keys({
      token: Joi.string().required()
    })
  }), publicAccessJWT, readApiInformations, readFlow4DetectorInformation, apiAccessController.status)

  routes.get('/public/access/changes/:serviceName', celebrate({
    [Segments.QUERY]: Joi.object().keys({
      token: Joi.string().required()
    })
  }), publicAccessJWT, readApiInformations, readFlow4DetectorInformation, apiAccessController.changes)


  // CPFL ROUTES
  routes.get('/public/access/cpfl/:state', celebrate({
    [Segments.QUERY]: Joi.object().keys({
      token: Joi.string().required()
    }),
    [Segments.PARAMS]: Joi.object().keys({
      state: Joi.string().required()
    })
  }), publicAccessJWT, readApiInformations, readFlow4EnergyInformation, cpflEnergyPermissions, cpflController.getCPFLStateJson)
  
  routes.get('/public/access/cpfl/:state/:city', celebrate({
    [Segments.QUERY]: Joi.object().keys({
      token: Joi.string().required()
    }),
    [Segments.PARAMS]: Joi.object().keys({
      state: Joi.string().required(),
      city: Joi.string().required()
    })
  }), publicAccessJWT, readApiInformations, readFlow4EnergyInformation, cpflController.getCPFLCityJson)

  routes.get('/public/access/cpfl/count/status/:state', celebrate({
    [Segments.QUERY]: Joi.object().keys({
      token: Joi.string().required(),
      bairro: Joi.string().optional(),
      rua: Joi.string().optional()
    })
  }), publicAccessJWT, readApiInformations, readFlow4EnergyInformation, cpflEnergyPermissions, cpflController.getCountStatus)
  
  routes.get('/public/access/cpfl/count/causas/:state', celebrate({
    [Segments.QUERY]: Joi.object().keys({
      token: Joi.string().required(),
      bairro: Joi.string().optional(),
      rua: Joi.string().optional()
    })
  }), publicAccessJWT, readApiInformations, readFlow4EnergyInformation, cpflEnergyPermissions, cpflController.getCountReasons)

  routes.get('/public/access/cpfl/count/resumo/actualDate', celebrate({
    [Segments.QUERY]: Joi.object().keys({
      token: Joi.string().required()
    })
  }), publicAccessJWT, readApiInformations, readFlow4EnergyInformation, cpflController.getSummary)

  // EQUATORIAL ROUTES
  routes.get('/public/access/equatorial/count/status/:state', celebrate({
    [Segments.QUERY]: Joi.object().keys({
      token: Joi.string().required(),
      bairro: Joi.string().optional(),
      rua: Joi.string().optional()
    })
  }), publicAccessJWT, readApiInformations, readFlow4EnergyInformation, cpflEnergyPermissions, equatorialController.getCountStatus)

  routes.get('/public/access/equatorial/count/causas/:state', celebrate({
    [Segments.QUERY]: Joi.object().keys({
      token: Joi.string().required(),
      bairro: Joi.string().optional(),
      rua: Joi.string().optional()
    })
  }), publicAccessJWT, equatorialController.getCountReasons)

  routes.get('/public/access/equatorial/count/resumo/actualDate', celebrate({
    [Segments.QUERY]: Joi.object().keys({
      token: Joi.string().required()
    })
  }), publicAccessJWT, readApiInformations, readFlow4EnergyInformation, equatorialController.getSummary)
} 