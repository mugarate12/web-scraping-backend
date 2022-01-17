import { Router } from 'express'

import {
  ocrController
} from './../controllers'

function ocrRoutes(routes: Router) {
  routes.get('/ocr/test', ocrController.updateManually)
}

export default ocrRoutes
