const { Router } = require('express');
const routes = Router();
const Controller = require('./Controller');

routes.post('/buscar', Controller.getNews);
routes.get('/validar',Controller.validAPP)


module.exports = routes;