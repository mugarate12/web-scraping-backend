import { Router } from 'express'
import { celebrate, Joi, Segments } from 'celebrate'

import {
  energisaController
} from './../controllers'

function energisaRoutes(routes: Router) {
  routes.get('/energisa', energisaController.test)
}

export default energisaRoutes
