import { Router } from 'express'
import { celebrate, Joi, Segments } from 'celebrate'

import { 
  apiAccessController,
  downDetectorController,
  servicesController,
  sessionController,
  usersController
} from './controllers'
import { 
  authJWT,
  createUserPermission,
  createServicePermission,
  readApiInformations,
  readApiInformationByUser,
  readUsersPermission,
  readServicesPermission
} from './middlewares'

const routes = Router()

routes.get(`/`, async (req, res) => {
  return res.status(200).json({ message: 'API funcionando!' })
})

routes.get('/downDetector/:serviceName', celebrate({
  [Segments.PARAMS]: Joi.object().keys({
    serviceName: Joi.string().required()
  })
}), downDetectorController.accessDownDetector)

// users routes
routes.post('/users', celebrate({
  [Segments.BODY]: Joi.object().keys({
    login: Joi.string().required(),
    password: Joi.string().required(),
    isAdmin: Joi.boolean().required()
  })
}), authJWT, createUserPermission, usersController.create)

routes.get('/users', readUsersPermission, usersController.index)

routes.put('/users/:id', celebrate({
  [Segments.PARAMS]: Joi.object().keys({
    id: Joi.number().required()
  }),
  [Segments.BODY]: Joi.object().keys({
    password: Joi.string().required()
  })
}), authJWT, createUserPermission, usersController.update)

routes.delete('/users/:userID', celebrate({
  [Segments.PARAMS]: Joi.object().keys({
    userID: Joi.number().required()
  })
}), authJWT, createUserPermission, usersController.delete)

// session routes
routes.post('/session', celebrate({
  [Segments.BODY]: Joi.object().keys({
    login: Joi.string().required(),
    password: Joi.string().required()
  })
}), sessionController.create)

// services routes
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

// api access
routes.post('/public/create', celebrate({
  [Segments.BODY]: Joi.object().keys({
    identifier: Joi.string().required()
  })
}), authJWT, readApiInformationByUser, apiAccessController.create)

export default routes