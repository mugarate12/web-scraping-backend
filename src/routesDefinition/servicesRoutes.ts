import { Router } from 'express'
import { celebrate, Joi, Segments } from 'celebrate'

import {
  downDetectorController,
  servicesController
} from './../controllers'

import {
  authJWT,
  createServicePermission,
  readServicesPermission
} from './../middlewares'

export default function servicesRoutes(routes: Router) {
  routes.post('/services', celebrate({
    [Segments.BODY]: Joi.object().keys({
      serviceName: Joi.string().required(),
      updateTime: Joi.number().required()
    })
  }), authJWT, createServicePermission, servicesController.add)
  
  routes.get('/services', authJWT, readServicesPermission, servicesController.index)
  routes.get('/service/:serviceName', authJWT, readServicesPermission, downDetectorController.accessDownDetectorSingleUpdate)
  routes.get('/services/updateTime', authJWT, readServicesPermission, servicesController.getServicesUpdateTime)
  
  routes.put('/services/:serviceID', celebrate({
    [Segments.BODY]: Joi.object().keys({
      updateTime: Joi.number().optional(),
      able: Joi.number().optional()
    }),
    [Segments.PARAMS]: Joi.object().keys({
      serviceID: Joi.number().required()
    })
  }), authJWT, createServicePermission, servicesController.update)
  
  routes.delete('/services/:serviceID', celebrate({
    [Segments.PARAMS]: Joi.object().keys({
      serviceID: Joi.number().required()
    })
  }), authJWT, createServicePermission, servicesController.delete)
  
}