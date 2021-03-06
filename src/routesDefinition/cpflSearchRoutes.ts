import { celebrate, Joi, Segments } from 'celebrate'
import { Router } from 'express'

import {  cpflController, cpflSearchController } from './../controllers'

import {
  authJWT,
  createServicePermission,
  readServicesPermission
} from './../middlewares'

function cpflSearchRoutes(routes: Router) {
  routes.post('/service/cpfl', celebrate({
    [Segments.BODY]: Joi.object().keys({
      state: Joi.string().required(),
      city: Joi.string().required(),
      dealership: Joi.string().required(),
      update_time: Joi.number().required(),
      clientsKeys: Joi.array().items(Joi.number()).required()
    })
  }), authJWT, cpflSearchController.create)

  routes.get('/service/cpfl', cpflSearchController.index)

  routes.put('/service/cpfl/:id', celebrate({
    [Segments.PARAMS]: Joi.object().keys({
      id: Joi.number().required()
    }),
    [Segments.BODY]: Joi.object().keys({
      updateTime: Joi.number().optional(),
      able: Joi.number().optional().min(1).max(2)
    })
  }), cpflSearchController.update)

  routes.delete('/service/cpfl/:id', celebrate({
    [Segments.PARAMS]: Joi.object().keys({
      id: Joi.number().required()
    })
  }), authJWT, cpflSearchController.delete)

  routes.get('/service/cpfl/servicesPerClients', cpflSearchController.getSearchsPerClients)
  routes.get('/service/cpfl/updateTime', cpflSearchController.getLastExecution)

  routes.get('/service/cpfl/dealerships', cpflSearchController.getDealerShips)
  routes.get('/service/cpfl/states/:dealership', cpflSearchController.getStates)
  routes.get('/service/cpfl/states/:dealership/:state/cities', cpflSearchController.getCities)
  routes.get('/service/cpfl/updatesTimes', cpflSearchController.getUpdatesTimes)

  routes.get('/service/cpfl/client/access/:dealership/:state/:clientKey', cpflSearchController.getCitiesToClientKeyHaveAccess)
}

export default cpflSearchRoutes