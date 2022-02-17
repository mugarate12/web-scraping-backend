import { Router } from 'express'
import { celebrate, Joi, Segments } from 'celebrate'

import { 
  downDetectorController
} from './controllers'

import {
  cpfl,
  cpflSearch,
  energisa,
  hostsPerfis,
  nfseFazenda,
  ocr,
  publicAccess,
  services,
  session,
  users,
  zabbix
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

// cpfl
cpfl(routes)
cpflSearch(routes)

// energisa routes
energisa(routes)

// hosts perfis
hostsPerfis(routes)

// nfse fazenda routes
nfseFazenda(routes)

// ocr
ocr(routes)

// users routes
users(routes)

// session routes
session(routes)

// services routes
services(routes)

// api access
publicAccess(routes)

// zabbix routes
zabbix(routes)

export default routes