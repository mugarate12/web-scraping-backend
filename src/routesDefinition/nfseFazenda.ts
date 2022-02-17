import { Router } from 'express'

import {
  publicAccessJWT
} from './../middlewares'

import {
  nfseFazendaController
} from './../controllers'

function nfseFazendaRoutes(routes: Router) {
  routes.get('/nfefazenda/test', nfseFazendaController.test)

  routes.get('/nfefazenda', nfseFazendaController.getInformations)

  routes.post('/nfefazenda/addPermissions', nfseFazendaController.addPermissions)
  routes.delete('/nfefazenda/removePermissions', nfseFazendaController.removePermissions)

  routes.get('/public/access/nfefazenda', publicAccessJWT, nfseFazendaController.sendJson)
}

export default nfseFazendaRoutes