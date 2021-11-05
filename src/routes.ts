import { Router } from 'express'
import { celebrate, Joi, Segments } from 'celebrate'

import { 
  downDetectorController,
  servicesController,
  sessionController,
  usersController
} from './controllers'
import authJWT from './middlewares/authJWT'

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
    password: Joi.string().required()
  })
}), authJWT, usersController.create)

routes.get('/users', usersController.index)

routes.put('/users/:id', celebrate({
  [Segments.BODY]: Joi.object().keys({
    password: Joi.string().required()
  })
}), authJWT, usersController.update)

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
}), servicesController.add)

routes.get('/services', servicesController.index)

routes.put('/services/:serviceID', celebrate({
  [Segments.BODY]: Joi.object().keys({
    updateTime: Joi.number().required()
  }),
  [Segments.PARAMS]: Joi.object().keys({
    serviceID: Joi.number().required()
  })
}), servicesController.update)

routes.delete('/services/:serviceID', celebrate({
  [Segments.PARAMS]: Joi.object().keys({
    serviceID: Joi.number().required()
  })
}), servicesController.delete)

export default routes