import { Router } from 'express'
import { celebrate, Joi, Segments } from 'celebrate'

import {
  apiAccessController,
  cpflController,
  equatorialController,
  energisaController,
  ocrController
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
  }), publicAccessJWT, cpflController.getCPFLStateJson)
  
  routes.get('/public/access/cpfl/:state/:city', celebrate({
    [Segments.QUERY]: Joi.object().keys({
      token: Joi.string().required()
    }),
    [Segments.PARAMS]: Joi.object().keys({
      state: Joi.string().required(),
      city: Joi.string().required()
    })
  }), publicAccessJWT, cpflController.getCPFLCityJson)

  routes.get('/public/access/cpfl/count/status/:state', celebrate({
    [Segments.QUERY]: Joi.object().keys({
      token: Joi.string().required(),
      bairro: Joi.string().optional(),
      rua: Joi.string().optional()
    })
  }), publicAccessJWT, cpflController.getCountStatus)
  
  routes.get('/public/access/cpfl/count/causas/:state', celebrate({
    [Segments.QUERY]: Joi.object().keys({
      token: Joi.string().required(),
      bairro: Joi.string().optional(),
      rua: Joi.string().optional()
    })
  }), publicAccessJWT, cpflController.getCountReasons)

  routes.get('/public/access/cpfl/count/resumo/actualDate', celebrate({
    [Segments.QUERY]: Joi.object().keys({
      token: Joi.string().required()
    })
  }), publicAccessJWT, cpflController.getSummary)

  // EQUATORIAL ROUTES
  routes.get('/public/access/equatorial/:state', celebrate({
    [Segments.QUERY]: Joi.object().keys({
      token: Joi.string().required()
    }),
    [Segments.PARAMS]: Joi.object().keys({
      state: Joi.string().required()
    })
  }), publicAccessJWT, equatorialController.getPerState)

  routes.get('/public/access/equatorial/count/status/:state', celebrate({
    [Segments.QUERY]: Joi.object().keys({
      token: Joi.string().required(),
      bairro: Joi.string().optional(),
      rua: Joi.string().optional()
    })
  }), publicAccessJWT, equatorialController.getCountStatus)

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
  }), publicAccessJWT, equatorialController.getSummary)

  // ENERGISA ROUTES
  routes.get('/public/access/energisa/all', celebrate({
    [Segments.QUERY]: Joi.object().keys({
      token: Joi.string().required()
    }),
    // [Segments.PARAMS]: Joi.object().keys({
    //   state: Joi.string().required()
    // })
  }), publicAccessJWT, energisaController.getDataByState)

  routes.get('/public/access/energisa/count/status/all', celebrate({
    [Segments.QUERY]: Joi.object().keys({
      token: Joi.string().required()
    })
  }), publicAccessJWT, energisaController.getCountStatus)

  routes.get('/public/access/energisa/count/resumo/actualDate', celebrate({
    [Segments.QUERY]: Joi.object().keys({
      token: Joi.string().required()
    })
  }), publicAccessJWT, energisaController.getSummary)

  // OCR ROUTES
  routes.get('/public/access/ocr/all', celebrate({
    [Segments.QUERY]: Joi.object().keys({
      token: Joi.string().required()
    })
  }), publicAccessJWT, ocrController.getAllData)
  
  routes.get('/public/access/ocr/all/withoutKey', ocrController.getAllDataWithoutKey)
} 