import { Router } from 'express'

import {
  cpflController
} from './../controllers'

function cpflRoutes(routes: Router) {
  routes.get('/cpfl', cpflController.getCPFL)

  routes.get('/cpfl/singleUpdate/:state/:city', cpflController.updateManually)
  
}

export default cpflRoutes