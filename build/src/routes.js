"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const celebrate_1 = require("celebrate");
const controllers_1 = require("./controllers");
const authJWT_1 = __importDefault(require("./middlewares/authJWT"));
const routes = (0, express_1.Router)();
routes.get(`/`, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    return res.status(200).json({ message: 'API funcionando!' });
}));
routes.get('/downDetector/:serviceName', (0, celebrate_1.celebrate)({
    [celebrate_1.Segments.PARAMS]: celebrate_1.Joi.object().keys({
        serviceName: celebrate_1.Joi.string().required()
    })
}), controllers_1.downDetectorController.accessDownDetector);
// users routes
routes.post('/users', (0, celebrate_1.celebrate)({
    [celebrate_1.Segments.BODY]: celebrate_1.Joi.object().keys({
        login: celebrate_1.Joi.string().required(),
        password: celebrate_1.Joi.string().required()
    })
}), authJWT_1.default, controllers_1.usersController.create);
routes.put('/users', (0, celebrate_1.celebrate)({
    [celebrate_1.Segments.BODY]: celebrate_1.Joi.object().keys({
        password: celebrate_1.Joi.string().required()
    })
}), authJWT_1.default, controllers_1.usersController.update);
// session routes
routes.post('/session', (0, celebrate_1.celebrate)({
    [celebrate_1.Segments.BODY]: celebrate_1.Joi.object().keys({
        login: celebrate_1.Joi.string().required(),
        password: celebrate_1.Joi.string().required()
    })
}), controllers_1.sessionController.create);
// services routes
routes.post('/services', (0, celebrate_1.celebrate)({
    [celebrate_1.Segments.BODY]: celebrate_1.Joi.object().keys({
        serviceName: celebrate_1.Joi.string().required(),
        updateTime: celebrate_1.Joi.number().required()
    })
}), controllers_1.servicesController.add);
routes.put('/services/:serviceID', (0, celebrate_1.celebrate)({
    [celebrate_1.Segments.BODY]: celebrate_1.Joi.object().keys({
        updateTime: celebrate_1.Joi.number().required()
    }),
    [celebrate_1.Segments.PARAMS]: celebrate_1.Joi.object().keys({
        serviceID: celebrate_1.Joi.number().required()
    })
}), controllers_1.servicesController.update);
routes.delete('/services/:serviceID', (0, celebrate_1.celebrate)({
    [celebrate_1.Segments.PARAMS]: celebrate_1.Joi.object().keys({
        serviceID: celebrate_1.Joi.number().required()
    })
}), controllers_1.servicesController.delete);
exports.default = routes;
