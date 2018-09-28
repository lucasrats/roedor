'use strict'

var express = require('express');
var MatchController = require('../controllers/match');

// cargamos los métodos de express para usar POST, GET, PUT, etc
var api = express.Router();
var md_auth = require('../middlewares/authenticated');

var multipart = require('connect-multiparty');

// definimos las rutas, invocando las funciones del controlador
api.get('/match/:id', MatchController.getMatch);
api.get('/matches/:page', md_auth.ensureAuth, MatchController.getMatches);
api.post('/match/addchat/:id', md_auth.ensureAuth, MatchController.addChatMatch);
api.post('/match/sendresult/:id', md_auth.ensureAuth, MatchController.sendResult);
api.post('/match/confirm/:id', md_auth.ensureAuth, MatchController.confirmMatch);
api.post('/match/classes-select/:id', md_auth.ensureAuth, MatchController.classesSelect);
api.post('/match/classes-ban/:id', md_auth.ensureAuth, MatchController.classesBan);

module.exports = api;
