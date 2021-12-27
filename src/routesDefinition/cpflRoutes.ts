import { Router } from 'express'

import {
  cpflController
} from './../controllers'

function cpflRoutes(routes: Router) {
  routes.get('/cpfl', cpflController.getCPFL)
}

export default cpflRoutes