import { Router } from 'express'

import {
  ocrController
} from './../controllers'

function ocrRoutes(routes: Router) {
  routes.get('/ocr/test', ocrController.updateManually)

  routes.post('/ocr/permission/add', ocrController.addPermission)
  routes.post('/ocr/permission/remove', ocrController.removePermission)
}

export default ocrRoutes
