import { celebrate, Joi, Segments } from 'celebrate'
import { Router } from 'express'

import {  cpflController, cpflSearchController } from './../controllers'

function cpflSearchRoutes(routes: Router) {
  routes.post('/service/cpfl', celebrate({
    [Segments.BODY]: Joi.object().keys({
      state: Joi.string().required(),
      city: Joi.string().required()
    })
  }), cpflSearchController.create)

  routes.get('/service/cpfl', cpflSearchController.index)

  routes.put('/service/cpfl/:id', celebrate({
    [Segments.PARAMS]: Joi.object().keys({
      id: Joi.number().required()
    }),
    [Segments.BODY]: Joi.object().keys({
      able: Joi.number().required().min(1).max(2)
    })
  }), cpflSearchController.update)

  routes.delete('/service/cpfl/:id', celebrate({
    [Segments.PARAMS]: Joi.object().keys({
      id: Joi.number().required()
    })
  }), cpflSearchController.delete)

  routes.get('/service/cpfl/states', cpflController.getStatesRequest)
  routes.get('/service/cpfl/states/:state/cities', cpflController.getCitiesRequest)
}

export default cpflSearchRoutes