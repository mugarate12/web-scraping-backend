import { Router } from 'express'

import {
  nfseFazendaController
} from './../controllers'

function nfseFazendaRoutes(routes: Router) {
  routes.get('/nfsefazenda/test', nfseFazendaController.test)
}

export default nfseFazendaRoutes