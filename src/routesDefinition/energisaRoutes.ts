import { Router } from 'express'
import { celebrate, Joi, Segments } from 'celebrate'

import {
  energisaController
} from './../controllers'

function energisaRoutes(routes: Router) {
  routes.get('/energisa', energisaController.test)

  routes.get(`/energisa/singleUpdate/:state/:city`, celebrate({
    [Segments.PARAMS]: Joi.object().keys({
      state: Joi.string().required(),
      city: Joi.string().required()
    })
  }), energisaController.updateManually)
}

export default energisaRoutes
