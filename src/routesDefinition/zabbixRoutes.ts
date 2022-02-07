import { Router } from 'express'
import { celebrate, Joi, Segments } from 'celebrate'

import {
  zabbixController
} from './../controllers'

function zabbixRoutes(routes: Router) {
  routes.get('/zabbix/:worksheetID', celebrate({
    [Segments.PARAMS]: Joi.object().keys({
      worksheetID: Joi.string().required()
    })
  }), zabbixController.getWorksheetRowsData)
}

export default zabbixRoutes
