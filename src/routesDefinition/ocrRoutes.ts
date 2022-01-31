import { celebrate, Joi, Segments } from 'celebrate'
import { Router } from 'express'

import {
  ocrController
} from './../controllers'

function ocrRoutes(routes: Router) {
  routes.get('/ocr/test', ocrController.updateManually)

  routes.get('/ocr/registred/states', ocrController.getRegistredStates)
  routes.get('/ocr/registred/:state/cities', celebrate({
    [Segments.PARAMS]: Joi.object().keys({
      state: Joi.string().required()
    })
  }), ocrController.getRegistredCities)
  routes.get('/ocr/registred/:state/:city/services', celebrate({
    [Segments.PARAMS]: Joi.object().keys({
      state: Joi.string().required(),
      city: Joi.string().required()
    })
  }), ocrController.getRegistredServices)

  routes.post('/ocr/permission/add', celebrate({
    [Segments.BODY]: Joi.object().keys({
      permissions: Joi.array().items({
        client_FK: Joi.number().required(),
        state: Joi.string().required(),
        city: Joi.string().required(),
        service: Joi.string().required()
      })
    })
  }), ocrController.addPermission)
  routes.post('/ocr/permission/remove', celebrate({
    [Segments.BODY]: Joi.object().keys({
      permissions: Joi.array().items({
        client_FK: Joi.number().required(),
        state: Joi.string().required(),
        city: Joi.string().required(),
        service: Joi.string().required()
      })
    })
  }), ocrController.removePermission)

  routes.get('/ocr/registred/all', ocrController.index)
  routes.put('/ocr/update/able', celebrate({
    [Segments.BODY]: Joi.object().keys({
      state: Joi.string().required(),
      city: Joi.string().required(),
      service: Joi.string().required(),
      able: Joi.number().required()
    })
  }), ocrController.updateServiceAble)
}

export default ocrRoutes
