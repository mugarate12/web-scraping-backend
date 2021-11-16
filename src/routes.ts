import { Router } from 'express'
import { celebrate, Joi, Segments } from 'celebrate'

import { 
  downDetectorController
} from './controllers'

import {
  publicAccess,
  services,
  session,
  users
} from './routesDefinition'

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
users(routes)

// session routes
session(routes)

// services routes
services(routes)

// api access
publicAccess(routes)

export default routes