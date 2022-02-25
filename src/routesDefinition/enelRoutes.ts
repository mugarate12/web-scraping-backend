import { Router } from "express"

import {
  enelController
} from './../controllers'

function enelRoutes(routes: Router) {
  routes.get('/enel/test', enelController.test)
}

export default enelRoutes