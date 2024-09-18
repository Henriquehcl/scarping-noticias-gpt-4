const { Router } = require('express');
const routes = Router();
const Controller = require('./Controller');

routes.post('/buscar', Controller.getNews);


module.exports = routes;