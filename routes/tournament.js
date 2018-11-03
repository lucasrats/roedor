'use strict'

var express = require('express');
var TournamentController = require('../controllers/tournament');

// cargamos los métodos de express para usar POST, GET, PUT, etc
var api = express.Router();
var md_auth = require('../middlewares/authenticated');

var multipart = require('connect-multiparty');

// definimos las rutas, invocando las funciones del controlador
api.post('/tournament/create', md_auth.ensureAuth, TournamentController.saveTournament);
api.get('/tournament/:id', TournamentController.getTournament);
api.get('/tournaments/:page?', TournamentController.getTournaments);
api.put('/tournament/:id', TournamentController.updateTournament);
api.get('/tournament/:id/joined', md_auth.ensureAuth, TournamentController.isParticipant);
api.post('/tournament/join/:id', md_auth.ensureAuth, TournamentController.joinTournament);
api.delete('/tournament/unjoin/:id', md_auth.ensureAuth, TournamentController.unjoinTournament);
api.post('/tournament/checkin/:id', md_auth.ensureAuth, TournamentController.checkInTournament);
api.post('/tournament/checkout/:id', md_auth.ensureAuth, TournamentController.checkOutTournament);
api.post('/tournament/addchat/:id', md_auth.ensureAuth, TournamentController.addChatTournament);
api.post('/tournament/start/:id', md_auth.ensureAuth, TournamentController.startTournament);
api.post('/tournament/nextround/:id', md_auth.ensureAuth, TournamentController.nextRoundSwiss);
api.get('/tournament/:id/participants', TournamentController.getParticipants);
api.get('/tournament/:tournament/participant/:user', TournamentController.getParticipant);
api.post('/tournament/:tournament/participant/newDeck', md_auth.ensureAuth, TournamentController.addDeckCode);
api.post('/tournament/:tournament/participant/newPack', md_auth.ensureAuth, TournamentController.addCardsPool);
api.get('/tournament/:id/matches', TournamentController.getMatches);
api.get('/tournament/:id/standings', TournamentController.getStandings);
api.get('/tournament/:id/isadmin', md_auth.ensureAuth, TournamentController.isAdminTournament);

module.exports = api;
