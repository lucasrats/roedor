'use strict'

var mongoosePaginate = require('mongoose-pagination');
var path = require('path');
var Tournament = require('../models/tournament');
var User = require('../models/user');
var Participant = require('../models/participant');
var Match = require('../models/match');
var Device = require('../models/device');
var moment = require('moment');

function saveTournament(req, res){

	var params = req.body;
	var tournament = new Tournament();
	if(params.name && params.game && params.start_date && params.rules){

		tournament.name = params.name;
		tournament.game = params.game;
		tournament.created_by = req.user.sub;
		tournament.start_date = moment(params.start_date, 'D/M/YYYY').unix();
		tournament.max_players = params.max_players;
		//tournament.type = 'swiss';
		tournament.type = params.type;
		tournament.rules = params.rules;
		tournament.active = false;
		tournament.week = 0;
		tournament.bans = params.bans;
		tournament.bo = params.bo;
		tournament.lower_bracket = params.lower_bracket;
		tournament.draft = params.draft;
		tournament.chat = null;
		tournament.byes = null;
		tournament.decks = params.decks;

		tournament.save((err, tournamentStored) => {
			if(err) return res.status(500).send({message: 'Error al crear el torneo.'});

			if(tournamentStored){
				return res.status(200).send({tournament: tournamentStored});
			}else{
				return res.status(404).send({message: 'No se ha podido registrar el torneo.'});
			}
		});
	}
	else{
		return res.status(200).send({
			message: 'Falta indicar algún dato obligatorio. Por favor, revísalo.'
		});
	}
}

function getTournament(req, res){

	var tournamentId = req.params.id;

	Tournament.findById(tournamentId).populate('game', 'name image').populate('created_by', '_id nick image').exec((err, tournament) => {
		if(err) return res.status(500).send({message: 'Error al devolver el torneo'});

		if(!tournament) return res.status(404).send({message: 'No existe ese torneo'});

		return res.status(200).send({tournament});
	});

}

function getTournaments(req, res){
	var page = 1;

	if(req.params.page){
		page = req.params.page;
	}

	var itemsPerPage = 8;

	Tournament.find().sort('+start_date').populate('game', 'name image').paginate(page, itemsPerPage, (err, tournaments, total) =>{
		if(err) return res.status(500).send({message: 'Error al devolver las publicaciones'});

		if(!tournaments) return res.status(404).send({message: 'Error al devolver los torneos'});

		return res.status(200).send({
			total_items: total,
			tournaments,
			pages: Math.ceil(total/itemsPerPage),
			page,
			itemsPerPage
		});
	});
}

function updateTournament(req, res){

	var update = req.body;
	var tournamentId = req.params.id;

	Tournament.findByIdAndUpdate(tournamentId, update, {new: true}, (err, tournamentUpdate) => {
		if(err) return res.status(500).send({message: err});

		if(!tournamentUpdate) return res.status(404).send({message: 'No se ha podido actualizar el torneo'});

		return res.status(200).send({tournament: tournamentUpdate});
	});

}

function isParticipant(req, res){

	var tournamentId = req.params.id;

	if(!req.user) return res.status(500).send({joined: false});

	Participant.findOne({'tournament': tournamentId, 'user': req.user.sub}, (err, participant) => {
			if(err) return res.status(500).send({message: err});

			if(!participant){
				return res.status(200).send({joined: false});
			}else{
				return res.status(200).send({joined: true});
			}
	});
}

function joinTournament(req, res){

	var tournamentId = req.params.id;
	var participant = new Participant();

	Tournament.findById(tournamentId, (err, tournament) => {
		if(err) return res.status(500).send({message: err});

		if(!tournament) return res.status(404).send({message: 'No existe ese torneo'});

		Participant.find({'tournament': tournamentId}, (err, participants) => {
			if(err) return res.status(500).send({message: err});

			if(!participants && participants.length >= tournament.max_players) return res.status(404).send({message: 'No se pueden apuntar más jugadores'});

			participant.tournament = tournament._id;
			participant.user = req.user.sub;
			participant.last_updated = moment().unix();
			//participant.checkin = false;
			//TODO Todo el rollo de que se active para hacer el checkin antes del comienzo y tal
			participant.checkin = true;
			participant.packs = tournament.draft;

			participant.save((err, participantStored) => {
				if(err) return res.status(500).send({message: 'Error al apuntarse al torneo'});

				if(!participantStored) return res.status(404).send({message: 'No se ha podido realizar la acción de apuntarse'});

				return res.status(200).send({participant: participantStored});
			});
		});

	});
}

function unjoinTournament(req, res){

	var tournamentId = req.params.id;
	var participant = new Participant();

	Participant.findOne({'tournament': tournamentId, 'user': req.user.sub}, (err, participant) => {
		if(err) return res.status(500).send({message: err});

		if(!participant) return res.status(404).send({message: 'No se pueden borrar la participación, no existe'});

		participant.remove((err, participantRemoved) => {
			if(err) return res.status(500).send({message: 'Se ha producido un error'});

			if(!participantRemoved) return res.status(404).send({message: 'No se ha podido realizar la acción de desapuntarse'});

			return res.status(200).send({participant: participantRemoved});
		});
	});
}

function checkInTournament(req, res){

	var tournamentId = req.params.id;

	Participant.update({$and: [{tournament: tournamentId}, {user: req.user.sub}]}, {checkin: 'true', last_updated: moment().unix()}, {"multi": false}, (err, participantUpdate) => {
		if(err) return res.status(500).send({message: err});

		if(!participantUpdate) return res.status(404).send({message: 'No se ha podido realizar Check In'});

		return res.status(200).send({participant: participantUpdate});
	});

}

function checkOutTournament(req, res){

	var tournamentId = req.params.id;

	Participant.update({$and: [{tournament: tournamentId}, {user: req.user.sub}]}, {checkin: 'false', last_updated: moment().unix()}, {"multi": false}, (err, participantUpdate) => {
		if(err) return res.status(500).send({message: err});

		if(!participantUpdate) return res.status(404).send({message: 'No se ha podido realizar Check out'});

		return res.status(200).send({participant: participantUpdate});
	});

}

function addChatTournament(req, res){

	var tournamentId = req.params.id;
	var update = req.body;
	var dateWrote = moment().unix();

	Tournament.findById(tournamentId, (err, tournament) => {
		if(err) return res.status(500).send({message: err});

		if(!tournament) return res.status(404).send({message: 'No existe ese torneo'});

		if(!tournament.chat){
			var chatToStore = JSON.stringify([{user: req.user.nick ,text: update.chat, date: dateWrote}]);
		}
		else{
			var actualChat = JSON.parse(tournament.chat);
			actualChat.push({user: req.user.nick ,text: update.chat, date: dateWrote});
			var chatToStore = JSON.stringify(actualChat);
		}


		Tournament.update({_id: tournamentId}, { chat: chatToStore }, { multi: false }, (err, tournamentUpdated) => {
			if(err) return res.status(500).send({message: err});

			if(!tournamentUpdated) return res.status(404).send({message: 'Ocurrió un error al guardar el chat'});

			return res.status(200).send({chat: {user: req.user.nick ,text: update.chat, date: dateWrote}});
		});
	});
}

function startTournament(req, res){

	var tournamentId = req.params.id;

	Tournament.findById(tournamentId, (err, tournament) => {
		if(err) return res.status(500).send({message: err});

		if(!tournament){
			return res.status(200).send({message: 'No existe ningún torneo con ese id'});
		}

		// quitamos a los jugadores que no tengan el checkin hecho
		Participant.remove({tournament: tournamentId, checkin: false}, (err) => {
			if(err) return res.status(500).send({message: 'Ha ocurrido un error al borrar los jugadores sin checkin'});

			//cogemos los participantes restantes, ordenados por fecha de apuntado al torneo. Y quitamos sobrantes si son > max_players
			Participant.find({tournament: tournamentId}).sort('last_updated').limit(tournament.max_players).exec((err, participants) => {
				if(err) return res.status(500).send({message: err});

				if(!participants){
					if(err) return res.status(404).send({message: 'No hay participantes! Que vas a empezar!'});
				}

				//console.log(participants);
				var participants_id = [];
				participants.forEach((participant) => {
					participants_id.push(participant.user);
				});

				Participant.remove({tournament: tournament, user: {"$nin": participants_id}}, (err) => {
					participants = shuffle(participants);
					//cuidado si se apuntan menos del max_players, hemos de coger solo los actuales
					//var max = tournament.max_players;
					var max = participants.length;
					var j = 1;

					if(tournament.type == 'swiss'){

						var home = null;
						var away = null;

						while(j < max){

							if(participants.length > 0){
								home = participants.pop();
							}
							else{
								home = null;
							}
							if(participants.length > 0){
								away = participants.pop();
							}
							else{
								away = null;
							}

							var match = new Match();
							match.tournament = tournamentId;
							match.game = tournament.game;
							match.match_date = tournament.start_date;
							match.status = 0;
							match.week = 1;
							if(home != null) match.home = home.user;
							if(away != null) match.away = away.user;

							match.save((err, matchStored) => {
								if(err) return res.status(500).send({message: err});

								if(!matchStored) res.status(404).send({message: 'Ha ocurrido un error al registrar el partido.'});
							});
							j += 2;

						}
						//comprobación de si los participantes son impares, y tenemos que meter un
						//console.log(participants.length);
						if(participants.length > 0){
							var match = new Match();
							match.tournament = tournamentId;
							match.game = tournament.game;
							match.match_date = tournament.start_date;
							match.status = 4;
							match.week = 1;
							match.homeScore = tournament.bo;
							match.awayScore = 0;
							match.home = participants[0].user;

							match.save((err, matchStored) => {
								if(err) return res.status(500).send({message: err});

								if(!matchStored) res.status(404).send({message: 'Ha ocurrido un error al registrar el partido.'});
							});
						}

						tournament.active = true;
						tournament.week = 1;
						//insertamos el usuario en el campo byes del torneo, para que no disfrute de otro en futuras rondas
						tournament.byes = participants[0].user;
						tournament.save();

						return res.status(200).send({message: 'Se han generado los partidos de la ronda 1. El torneo ha comenzado.'});

					}
					//TODO parafernalia de torneo KO
					else{

						var ronda = 1;
						var this_round = 0;
						var this_round2 = 1;
						var home = null;
						var away = null;
						max = participants.length;

						while(j < max){
							//console.log("ouye -> " + j);
							if(j <= Math.ceil(max / 2)){
								//primeras rondas
								if(participants.length > 0){
									home = participants.pop();
								}
								else{
									home = null;
								}
								if(participants.length > 0){
									away = participants.pop();
								}
								else{
									away = null;
								}

								var match = new Match();
								match.tournament = tournamentId;
								match.game = tournament.game;
								match.match_date = tournament.start_date;
								match.status = 0;
								match.week = 1;
								match.go_round = ronda;
								match.this_round = 0;
								if(home != null) match.home = home.user;
								if(away != null) match.away = away.user;

								match.save((err, matchStored) => {
									if(err) return res.status(500).send({message: err});

									if(!matchStored) res.status(404).send({message: 'Ha ocurrido un error al registrar el partido.'});

								});

								if(j % 2 == 0) ronda++;
								j++;
								this_round++;
							}
							else if(j == (max - 1)){
								//ronda final
								var match = new Match();
								match.tournament = tournamentId;
								match.game = tournament.game;
								match.match_date = tournament.start_date;
								match.status = 0;
								match.week = 1;
								match.go_round = 0;
								match.this_round = this_round2;

								match.save((err, matchStored) => {
									if(err) return res.status(500).send({message: err});

									if(!matchStored) res.status(404).send({message: 'Ha ocurrido un error al registrar el partido.'});


								});
								j++;
							}
							else{
								//console.log("ouye222 -> " + j);
								//rondas intermedias
								var match = new Match();
								match.tournament = tournamentId;
								match.game = tournament.game;
								match.match_date = tournament.start_date;
								match.status = 0;
								match.week = 1;
								match.go_round = ronda;
								match.this_round = this_round2;

								match.save((err, matchStored) => {
									if(err) return res.status(500).send({message: err});

									if(!matchStored) res.status(404).send({message: 'Ha ocurrido un error al registrar el partido.'});

								});

								if(j % 2 == 0) ronda++;
								this_round2++;
								j++;
							}
						}
					}
					//else type=KO
				});
			});
		});
	});
}

function nextRoundSwiss(req, res){

	var tournamentId = req.params.id;

	Tournament.findById(tournamentId, (err, tournament) => {
		if(err) return res.status(500).send({message: err});
		if(!tournament) res.status(404).send({message: 'El torneo seleccionado no existe'});

		Match.find({tournament: tournamentId}).exec((err, matches_tournament) => {

			var tournament_users = [];

			matches_tournament.forEach((match_tournament) => {
				var home = {user: '', wins: 0, miniwins: 0, losses: 0, points: 0};
				var away = {user: '', wins: 0, miniwins: 0, losses: 0, points: 0};

				if(match_tournament.status == 4){
					if(match_tournament.week > 1){
						home = tournament_users.find(user => user.user == '' + match_tournament.home);
						if(match_tournament.away){
							away = tournament_users.find(user => user.user == '' + match_tournament.away);
						}
					}
					else{
						home.user = '' + match_tournament.home;
						if(match_tournament.away){
							away.user = '' + match_tournament.away;
						}
					}

					home.miniwins += match_tournament.homeScore;
					away.miniwins += match_tournament.awayScore;

					if(match_tournament.homeScore > match_tournament.awayScore){
						home.wins += 1;
						away.losses += 1;
					}
					else{
						home.losses += 1;
						away.wins += 1;
					}

					home.points += (match_tournament.homeScore - match_tournament.awayScore);
					away.points += (match_tournament.awayScore - match_tournament.homeScore);

				}

				if(match_tournament.week == 1){
					tournament_users.push(home);
					if(away.user != ''){
						tournament_users.push(away);
					}
				}
			});

			//ordenamos por wins (V-D) y puntos
			var standings = tournament_users.sort(function (a, b) {
			  return b.wins - a.wins || b.points - a.points;
			});

			//si el campo byes no es nulo, es que tenemos participantes impares, y tenemos que sacar antes a un usuario para esta jornada
			let byeUserWeek;
			let i_index = 0;
			if(tournament.byes != null){
				let sw = false;

				standings.forEach((user, index) => {
					if((tournament.byes.indexOf(user.user) == -1) && sw == false){
						byeUserWeek = user.user;
						sw = true;
						i_index = index;
					}

				});
				//borramos al usuario
				standings.splice(i_index, 1);

				var match = new Match();
				match.tournament = tournamentId;
				match.game = tournament.game;
				match.match_date = tournament.start_date;
				match.status = 4;
				match.week = tournament.week + 1;
				match.homeScore = tournament.bo;
				match.awayScore = 0;
				match.home = byeUserWeek;

				match.save((err, matchStored) => {
					if(err) return res.status(500).send({message: err});

					if(!matchStored) res.status(404).send({message: 'Ha ocurrido un error al registrar el partido.'});

					//notificación push al usuario del partido
					let urlMatch = 'https://roedor.net/tournament/' + matchStored.tournament + '/match/' + matchStored._id;
					var message = {
					  app_id: "7094c9b9-5033-4055-ac33-4a09e39f63d8",
					  contents: {"en": "Tienes un nuevo partido de liga"},
					  include_player_ids: [],
						url: urlMatch
					};

					Device.find({user: matchStored.home}).exec((err, devices) => {
						if(err) return res.status(500).send({message: err});

						if(!devices) return res.status(404).send({message: 'No se encuentran dispositivos'});

						devices.forEach(device => {
							message.include_player_ids.push(device.serial);
						});
						sendNotification(message);
					});

				});
			}

			//standings actuales ordenados, vamos emparejando por orden 1-2,3-4,5-6,etc...
			var j = 1;
			let participants_number = standings.length;
			//while(j < tournament.max_players){
			while(j < participants_number){
				var home = [];
				var away = [];

				if(standings.length > 0){
					home = standings.shift();
				}
				else{
					home = null;
				}
				if(standings.length > 0){
					away = standings.shift();
				}
				else{
					away = null;
				}

				var match = new Match();
				match.tournament = tournamentId;
				match.game = tournament.game;
				match.match_date = tournament.start_date;
				match.status = 0;
				match.week = tournament.week + 1;
				if(home != null) match.home = home.user;
				if(away != null) match.away = away.user;

				match.save((err, matchStored) => {
					if(err) return res.status(500).send({message: err});

					if(!matchStored) res.status(404).send({message: 'Ha ocurrido un error al registrar el partido.'});

					//notificación push al usuario del partido
					let urlMatch = 'https://roedor.net/tournament/' + matchStored.tournament + '/match/' + matchStored._id;
					var message = {
					  app_id: "7094c9b9-5033-4055-ac33-4a09e39f63d8",
					  contents: {"en": "Tienes un nuevo partido de liga"},
					  include_player_ids: [],
						url: urlMatch
					};

					Device.find({user: {$in: [matchStored.home, matchStored.away]}}).exec((err, devices) => {
						console.log("nextRoundSwiss");
						console.log(devices);
						if(err) return res.status(500).send({message: err});

						if(!devices) return res.status(404).send({message: 'No se encuentran dispositivos'});

						devices.forEach(device => {
							message.include_player_ids.push(device.serial);
						});
						sendNotification(message);
					});
				});

				j += 2;
			}

			let byesArr = [];
			byesArr.push(tournament.byes);
			byesArr.push(byeUserWeek);

			tournament.week = tournament.week + 1;
			//insertamos el usuario en el campo byes del torneo, para que no disfrute de otro en futuras rondas
			tournament.byes = byesArr;
			tournament.save();

			return res.status(200).send({message: 'Se han generado los partidos de la ronda ' + (tournament.week + 1)});

		});
	});

}

function orderByProperty(prop) {
  var args = Array.prototype.slice.call(arguments, 1);
  return function (a, b) {
    var equality = a[prop] + b[prop];
    if (equality === 0 && arguments.length > 1) {
      return orderByProperty.apply(null, args)(a, b);
    }
    return equality;
  };
}

function shuffle(array) {
  var currentIndex = array.length, temporaryValue, randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}

function getParticipants(req, res){

	var tournamentId = req.params.id;

	Participant.find({'tournament': tournamentId}).populate('user').exec((err, participants) => {
		if(err) return res.status(500).send({message: 'Error al devolver los participantes'});

		if(!participants) return res.status(404).send({message: 'No hay participantes'});

		return res.status(200).send({participants, total: participants.length});
	});

}

function getParticipant(req, res){

	var tournamentId = req.params.tournament;
	var userId = req.params.user;

	Participant.findOne({'tournament': tournamentId, 'user': userId}).populate('user').exec((err, participant) => {
		if(err) return res.status(500).send({message: 'Error al devolver al participante'});

		if(!participant) return res.status(404).send({message: 'No hay participantes con ese id'});

		return res.status(200).send({participant});
	});

}

function getMatches(req, res){

	var tournamentId = req.params.id;

	Match.find({'tournament': tournamentId}).populate('home away').exec((err, matches) => {
		if(err) return res.status(500).send({message: 'Error al devolver los partidos'});

		if(!matches) return res.status(404).send({message: 'No hay partidos'});

		return res.status(200).send({matches, total: matches.length});
	});
}

function getStandings(req, res){

	var tournamentId = req.params.id;

	Tournament.findById(tournamentId, (err, tournament) => {
		if(err) return res.status(500).send({message: err});
		if(!tournament) res.status(404).send({message: 'El torneo seleccionado no existe'});

		var tournament_users = new Array();

		Match.find({tournament: tournamentId}).populate('home away', '_id nick').exec((err, matches_tournament) => {

			matches_tournament.forEach((match_tournament) => {
				var home = {id: '', nick: '', wins: 0, miniwins: 0, losses: 0, points: 0};
				var away = {id: '', nick: '', wins: 0, miniwins: 0, losses: 0, points: 0};

				if(match_tournament.status == 4){
					if(match_tournament.week > 1){

						home = tournament_users.find(user => user.id == '' + match_tournament.home._id);
						if(match_tournament.away){
							away = tournament_users.find(user => user.id == '' + match_tournament.away._id);
						}
					}
					else{
						home.id = '' + match_tournament.home._id;
						home.nick = '' + match_tournament.home.nick;
						//comprobación para partido de BYE
						if(match_tournament.away){
							away.id = '' + match_tournament.away._id;
							away.nick = '' + match_tournament.away.nick;
						}
						else{
							away.nick = "BYE";
						}
					}

					home.miniwins += match_tournament.homeScore;
					away.miniwins += match_tournament.awayScore;

					if(match_tournament.homeScore > match_tournament.awayScore){
						home.wins += 1;
						away.losses += 1;
					}
					else{
						home.losses += 1;
						away.wins += 1;
					}

					home.points += (match_tournament.homeScore - match_tournament.awayScore);
					away.points += (match_tournament.awayScore - match_tournament.homeScore);

				}

				if(match_tournament.week == 1){
					tournament_users.push(home);
					if(away.id != ''){
						tournament_users.push(away);
					}
				}
			});

			//ordenamos por wins (V-D) y pointsas
			var standings = tournament_users.sort(function (a, b) {
			  return b.wins - a.wins || b.points - a.points;
			});

			return res.status(200).send({standings});

			});
		});

	}

function isAdminTournament(req, res){

	var tournamentId = req.params.id;

	if(!req.user) return res.status(500).send({joined: false});

	Tournament.findOne({'_id': tournamentId, 'created_by': req.user.sub}, (err, isAdminTournament) => {
			if(err) return res.status(500).send({message: err});

			if(!isAdminTournament){
				return res.status(200).send({isAdminTournament: false});
			}else{
				return res.status(200).send({isAdminTournament: true});
			}
	});
}

function addDeckCode(req, res){

	var tournamentId = req.params.tournament;
	var update = req.body;

	Participant.findOne({tournament: tournamentId, user: req.user.sub}, (err, participant) => {
		if(err) return res.status(500).send({message: err});

		if(!participant) return res.status(404).send({message: 'No existe ese jugador'});

		if(!participant.decks){
			var decksToStore = JSON.stringify([{name: update.name, code: update.code}]);
		}
		else{
			var actualDeck = JSON.parse(participant.decks);
			actualDeck.push({name: update.name, code: update.code});
			var decksToStore = JSON.stringify(actualDeck);
		}

		Participant.update({_id: participant._id}, { decks: decksToStore }, { multi: false }, (err, participantUpdated) => {
			if(err) return res.status(500).send({message: err});

			if(!participantUpdated) return res.status(404).send({message: 'Ocurrió un error al guardar el mazo'});

			return res.status(200).send({deck: {name: update.name, code: update.code}});
		});

	});

}

function addCardsPool(req, res){

	var tournamentId = req.params.tournament;
	var update = req.body;

	Participant.findOne({tournament: tournamentId, user: req.user.sub}, (err, participant) => {
		if(err) return res.status(500).send({message: err});

		if(!participant) return res.status(404).send({message: 'No existe ese jugador'});

		var poolToStore = JSON.stringify(update);
		//console.log(poolToStore);

		Participant.update({_id: participant._id}, { cards_pool: poolToStore, packs: participant.packs - 1}, { multi: false }, (err, participantUpdated) => {
			if(err) return res.status(500).send({message: err});

			if(!participantUpdated) return res.status(404).send({message: 'Ocurrió un error al guardar el mazo'});

			return res.status(200).send({participantUpdated});
		});

	});

}

function sendNotification(data){
  var headers = {
    "Content-Type": "application/json; charset=utf-8"
  };

  var options = {
    host: "onesignal.com",
    port: 443,
    path: "/api/v1/notifications",
    method: "POST",
    headers: headers
  };

  var https = require('https');
  var req = https.request(options, function(res) {
    res.on('data', function(data) {
      /*console.log("Response:");
      console.log(JSON.parse(data));
			*/
    });
  });

  req.on('error', function(e) {
    console.log("ERROR:");
    console.log(e);
  });

  req.write(JSON.stringify(data));
  req.end();
}

module.exports = {
	saveTournament,
	getTournament,
	getTournaments,
	updateTournament,
	isParticipant,
	joinTournament,
	unjoinTournament,
	checkInTournament,
	checkOutTournament,
	addChatTournament,
	startTournament,
	nextRoundSwiss,
	getParticipants,
	getParticipant,
	getMatches,
	getStandings,
	isAdminTournament,
	addDeckCode,
	addCardsPool
}
