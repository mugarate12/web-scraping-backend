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

  routes.post('/ocr/permission/add', ocrController.addPermission)
  routes.post('/ocr/permission/remove', ocrController.removePermission)
}

export default ocrRoutes
