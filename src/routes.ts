import { Router } from 'express'
import { celebrate, Joi, Segments } from 'celebrate'

import { 
  downDetectorController,
  servicesController
} from './controllers'

const routes = Router()

routes.get(`/`, async (req, res) => {
  return res.status(200).json({ message: 'API funcionando!' })
})

routes.get('/downDetector/:serviceName', celebrate({
  [Segments.PARAMS]: Joi.object().keys({
    serviceName: Joi.string().required()
  })
}), downDetectorController.accessDownDetector)

routes.post('/services', celebrate({
  [Segments.BODY]: Joi.object().keys({
    serviceName: Joi.string().required(),
    updateTime: Joi.number().required()
  })
}), servicesController.add)

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