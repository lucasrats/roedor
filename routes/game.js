'use strict'

var express = require('express');
var GameController = require('../controllers/game');

// cargamos los métodos de express para usar POST, GET, PUT, etc
var api = express.Router();
var md_auth = require('../middlewares/authenticated');

var multipart = require('connect-multiparty');
var md_upload = multipart({uploadDir: './uploads/games'});

// definimos las rutas, invocando las funciones del controlador
api.post('/game/create', md_auth.ensureAuth, GameController.saveGame);
api.get('/game/get/:id', GameController.getGame);
api.get('/game/getAll', GameController.getGames);
api.put('/game/update/:id', md_auth.ensureAuth, GameController.updateGame);

module.exports = api;