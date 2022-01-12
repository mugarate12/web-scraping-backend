import { Router } from 'express'

import {
  cpflController,
  equatorialController
} from './../controllers'

function cpflRoutes(routes: Router) {
  routes.get('/cpfl', cpflController.getCPFL)

  routes.get('/cpfl/singleUpdate/:state/:city', cpflController.updateManually)

  routes.get('/equatorial/singleUpdate/:state/:city', equatorialController.updateManually)
  
}

export default cpflRoutes