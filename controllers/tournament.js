'use strict'

var mongoosePaginate = require('mongoose-pagination');
var path = require('path');
var Tournament = require('../models/tournament');
var User = require('../models/user');
var Participant = require('../models/participant');
var Match = require('../models/match');
var Device = require('../models/device');
var moment = require('moment');
var deckstrings = require('deckstrings');

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
			if(tournament.draft == 0 && tournament.decks == 0){
				participant.checkin = true;
			}
			else{
				participant.checkin = false;
			}
			//TODO Todo el rollo de que se active para hacer el checkin antes del comienzo y tal
			//participant.checkin = true;
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

								//notificación push al usuario del partido
								let urlTournament = 'https://roedor.net/tournament/' + matchStored.tournament;
								var message = {
								  app_id: "7094c9b9-5033-4055-ac33-4a09e39f63d8",
								  contents: {"en": "Ha comenzado el torneo: " + tournament.name},
								  include_player_ids: [],
									url: urlTournament
								};

								Device.find({user: {$in: [matchStored.home, matchStored.away]}}).exec((err, devices) => {
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

								//insertamos el usuario en el campo byes del torneo, para que no disfrute de otro en futuras rondas
								tournament.byes = participants[0].user;

								//notificación push al usuario del partido
								let urlTournament = 'https://roedor.net/tournament/' + matchStored.tournament;
								var message = {
								  app_id: "7094c9b9-5033-4055-ac33-4a09e39f63d8",
								  contents: {"en": "Ha comenzado el torneo: " + tournament.name},
								  include_player_ids: [],
									url: urlTournament
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

						tournament.active = true;
						tournament.week = 1;
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

									//notificación push al usuario del partido
									let urlTournament = 'https://roedor.net/tournament/' + matchStored.tournament;
									var message = {
									  app_id: "7094c9b9-5033-4055-ac33-4a09e39f63d8",
									  contents: {"en": "Ha comenzado el torneo: " + tournament.name},
									  include_player_ids: [],
										url: urlTournament
									};

									Device.find({user: {$in: [matchStored.home, matchStored.away]}}).exec((err, devices) => {
										if(err) return res.status(500).send({message: err});

										if(!devices) return res.status(404).send({message: 'No se encuentran dispositivos'});

										devices.forEach(device => {
											message.include_player_ids.push(device.serial);
										});
										sendNotification(message);
									});

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
						tournament.active = true;
						tournament.save();
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
		//comprobar si el deck no tiene cartas que no estén en el draft, ni básicas y tal
		try{
			var decoded = deckstrings.decode(update.code);
		}
		catch(err) {
			return res.status(500).send({message: err});
		}
		var cardError = "";
		var swError = false;

		for(var cardDeck of decoded.cards) {
			var swFound = false;
			var cardError = "";

			JSON.parse(participant.cards_pool).find((cardCollection) => {
				if(!swFound){
					//console.log(cardCollection.dbfId + " == " + cardDeck[0]);
					if(cardCollection.dbfId == cardDeck[0]){
						if(cardCollection.rarity != 'FREE'){
							if(cardCollection.quantity >= cardDeck[1]){
								swFound = true;
							}
							else{
								swFound = true;
								cardError = JSON.parse(JSON.stringify(cardDeck[0]));
							}
						}
						else{
							swFound = true;
						}
					}
				}
			});
			//carta del mazo que no se encuentra en la colección
			if(!swFound && cardError == ""){
				cardError = JSON.parse(JSON.stringify(cardDeck[0]));
				break;
			}
			else if(!swFound || cardError != ""){
				break;
			}
		}

		if(cardError != ""){
			return res.status(500).send({message: 'El mazo enviado no es correcto, por favor, revisa las cartas y las copias con respecto a tu draft.'});
		}
		else{
			if(!participant.decks){
				var decksToStore = JSON.stringify([{name: update.name, code: update.code}]);
				var actualDeck = "";
			}
			else{
				var actualDeck = JSON.parse(participant.decks);
				actualDeck.push({name: update.name, code: update.code});
				var decksToStore = JSON.stringify(actualDeck);
			}

			//comprobamos el número de decks que va a tener el usuario, para marcar el checkin como true
			Tournament.findById(tournamentId).exec((err, tournament) => {
					if(err) return res.status(500).send({message: err});

					if(!tournament) return res.status(404).send({message: 'Ocurrió un error al buscar el torneo'});

					var checkin = false;
					if(tournament.decks == actualDeck.length){
						checkin = true;
					}

					Participant.update({_id: participant._id}, { decks: decksToStore, checkin: checkin }, { multi: false }, (err, participantUpdated) => {
						if(err) return res.status(500).send({message: err});

						if(!participantUpdated) return res.status(404).send({message: 'Ocurrió un error al guardar el mazo'});

						//return res.status(200).send({deck: {name: update.name, code: update.code}});
						return res.status(200).send({deck: {name: update.name, cards: decoded}});
					});

			});
		}
	});
}

function addCardsPool(req, res){

	var tournamentId = req.params.tournament;
	var update = req.body;

	Participant.findOne({tournament: tournamentId, user: req.user.sub}, (err, participant) => {
		if(err) return res.status(500).send({message: err});

		if(!participant) return res.status(404).send({message: 'No existe ese jugador'});

		if((participant.packs - 1) == 0){
			//metemos el array de básicas
			var basicsJSON = JSON.parse('[{"name":"Lacayo de Villadorada","dbfId":922,"rarity":"FREE"},{"name":"Nova Sagrada","dbfId":841,"rarity":"FREE"},{"name":"Control mental","dbfId":8,"rarity":"FREE"},{"name":"Punición Sagrada","dbfId":279,"rarity":"FREE"},{"name":"Visión mental","dbfId":1099,"rarity":"FREE"},{"name":"Palabra de poder: escudo","dbfId":613,"rarity":"FREE"},{"name":"Zarpa","dbfId":1050,"rarity":"FREE"},{"name":"Toque de sanación","dbfId":773,"rarity":"FREE"},{"name":"Fuego lunar","dbfId":467,"rarity":"FREE"},{"name":"Marca de lo Salvaje","dbfId":213,"rarity":"FREE"},{"name":"Rugido salvaje","dbfId":742,"rarity":"FREE"},{"name":"Flagelo","dbfId":64,"rarity":"FREE"},{"name":"Crecimiento salvaje","dbfId":1124,"rarity":"FREE"},{"name":"Polimorfia","dbfId":77,"rarity":"FREE"},{"name":"Intelecto Arcano","dbfId":555,"rarity":"FREE"},{"name":"Descarga de Escarcha","dbfId":662,"rarity":"FREE"},{"name":"Deflagración Arcana","dbfId":447,"rarity":"FREE"},{"name":"Nova de Escarcha","dbfId":587,"rarity":"FREE"},{"name":"Reflejo exacto","dbfId":1084,"rarity":"FREE"},{"name":"Bola de Fuego","dbfId":315,"rarity":"FREE"},{"name":"Fogonazo","dbfId":1004,"rarity":"FREE"},{"name":"Elemental de agua","dbfId":395,"rarity":"FREE"},{"name":"Choque de Escarcha","dbfId":971,"rarity":"FREE"},{"name":"Viento furioso","dbfId":51,"rarity":"FREE"},{"name":"Sanación ancestral","dbfId":149,"rarity":"FREE"},{"name":"Elemental de fuego","dbfId":189,"rarity":"FREE"},{"name":"Arma Muerdepiedras","dbfId":239,"rarity":"FREE"},{"name":"Ansia de sangre","dbfId":1171,"rarity":"FREE"},{"name":"Descarga de las Sombras","dbfId":914,"rarity":"FREE"},{"name":"Drenar vida","dbfId":919,"rarity":"FREE"},{"name":"Llamas infernales","dbfId":950,"rarity":"FREE"},{"name":"Corrupción","dbfId":982,"rarity":"FREE"},{"name":"Infernal aterrador","dbfId":1019,"rarity":"FREE"},{"name":"Abisario","dbfId":48,"rarity":"FREE"},{"name":"Puñalada","dbfId":180,"rarity":"FREE"},{"name":"Veneno mortal","dbfId":459,"rarity":"FREE"},{"name":"Golpe siniestro","dbfId":710,"rarity":"FREE"},{"name":"Asesinato","dbfId":345,"rarity":"FREE"},{"name":"Sprint","dbfId":630,"rarity":"FREE"},{"name":"Hoja de asesino","dbfId":421,"rarity":"FREE"},{"name":"Marca del cazador","dbfId":141,"rarity":"FREE"},{"name":"Bendición de poderío","dbfId":70,"rarity":"FREE"},{"name":"Guardián de los reyes","dbfId":1068,"rarity":"FREE"},{"name":"Luz Sagrada","dbfId":291,"rarity":"FREE"},{"name":"Justicia de la Luz","dbfId":383,"rarity":"FREE"},{"name":"Bendición de reyes","dbfId":943,"rarity":"FREE"},{"name":"Consagración","dbfId":476,"rarity":"FREE"},{"name":"Martillo de cólera","dbfId":250,"rarity":"FREE"},{"name":"Campeón de veraplata","dbfId":847,"rarity":"FREE"},{"name":"Cargar","dbfId":344,"rarity":"FREE"},{"name":"Golpe heroico","dbfId":1007,"rarity":"FREE"},{"name":"Hacha de guerra ígnea","dbfId":401,"rarity":"FREE"},{"name":"Ejecutar","dbfId":785,"rarity":"FREE"},{"name":"Segadora de arcanita","dbfId":304,"rarity":"FREE"},{"name":"Rajar","dbfId":940,"rarity":"FREE"},{"name":"Furibundo de magma","dbfId":1653,"rarity":"FREE"},{"name":"Quijaforte de oasis","dbfId":1370,"rarity":"FREE"},{"name":"Crocolisco fluvial","dbfId":1369,"rarity":"FREE"},{"name":"Bruto Lobo Gélido","dbfId":41,"rarity":"FREE"},{"name":"Líder de banda","dbfId":1401,"rarity":"FREE"},{"name":"Jinete de lobos","dbfId":289,"rarity":"FREE"},{"name":"Oso pardo Cueracero","dbfId":1182,"rarity":"FREE"},{"name":"Patriarca Lomoblanco","dbfId":67,"rarity":"FREE"},{"name":"Caballero de Ventormenta","dbfId":622,"rarity":"FREE"},{"name":"Fusilero de Forjaz","dbfId":339,"rarity":"FREE"},{"name":"Geomántico kóbold","dbfId":672,"rarity":"FREE"},{"name":"Inventora gnoma","dbfId":308,"rarity":"FREE"},{"name":"Comando Pico Tormenta","dbfId":413,"rarity":"FREE"},{"name":"Archimago","dbfId":525,"rarity":"FREE"},{"name":"Señor de la arena","dbfId":157,"rarity":"FREE"},{"name":"Asaltante múrloc","dbfId":191,"rarity":"FREE"},{"name":"Jabalí Colmipétreo","dbfId":648,"rarity":"FREE"},{"name":"Raptor Cienorrojo","dbfId":216,"rarity":"FREE"},{"name":"Guerrero Branquiazul","dbfId":739,"rarity":"FREE"},{"name":"Maestro de escudos Sen\'jin","dbfId":635,"rarity":"FREE"},{"name":"Yeti Viento Gélido","dbfId":90,"rarity":"FREE"},{"name":"Gólem de guerra","dbfId":712,"rarity":"FREE"},{"name":"Truhán de Bahía del Botín","dbfId":1140,"rarity":"FREE"},{"name":"Arquera elfa","dbfId":389,"rarity":"FREE"},{"name":"Cazadora de Rajacieno","dbfId":257,"rarity":"FREE"},{"name":"Mago ogro","dbfId":995,"rarity":"FREE"},{"name":"Ogro Puño de Roca","dbfId":1686,"rarity":"FREE"},{"name":"Can del Núcleo","dbfId":1687,"rarity":"FREE"},{"name":"Artificiera temeraria","dbfId":445,"rarity":"FREE"},{"name":"Campeón de Ventormenta","dbfId":753,"rarity":"FREE"},{"name":"Señor Lobo Gélido","dbfId":496,"rarity":"FREE"},{"name":"Protector Cortezaférrea","dbfId":205,"rarity":"FREE"},{"name":"Palabra de Sombras: dolor","dbfId":1367,"rarity":"FREE"},{"name":"Clériga de Villanorte","dbfId":1650,"rarity":"FREE"},{"name":"Espíritu divino","dbfId":1361,"rarity":"FREE"},{"name":"Águila ratonera famélica","dbfId":1241,"rarity":"FREE"},{"name":"Sanadora Escama Oscura","dbfId":582,"rarity":"FREE"},{"name":"Maestro de canes","dbfId":1003,"rarity":"FREE"},{"name":"Lobo gris","dbfId":606,"rarity":"FREE"},{"name":"Rinoceronte de la tundra","dbfId":699,"rarity":"FREE"},{"name":"Multidisparo","dbfId":292,"rarity":"FREE"},{"name":"Rastrear","dbfId":1047,"rarity":"FREE"},{"name":"Disparo Arcano","dbfId":877,"rarity":"FREE"},{"name":"Explosión mental","dbfId":545,"rarity":"FREE"},{"name":"Médico vudú","dbfId":132,"rarity":"FREE"},{"name":"Ingeniera novata","dbfId":284,"rarity":"FREE"},{"name":"Clériga Sol Devastado","dbfId":608,"rarity":"FREE"},{"name":"Mecánica de dragonizos","dbfId":523,"rarity":"FREE"},{"name":"Moco del pantano ácido","dbfId":906,"rarity":"FREE"},{"name":"Comandante Grito de Guerra","dbfId":1009,"rarity":"FREE"},{"name":"Abanico de cuchillos","dbfId":667,"rarity":"FREE"},{"name":"Estimular","dbfId":254,"rarity":"FREE"},{"name":"Fuego estelar","dbfId":823,"rarity":"FREE"},{"name":"Poderío totémico","dbfId":830,"rarity":"FREE"},{"name":"Maleficio","dbfId":766,"rarity":"FREE"},{"name":"Misiles Arcanos","dbfId":564,"rarity":"FREE"},{"name":"Puyazo","dbfId":573,"rarity":"FREE"},{"name":"Espiral mortal","dbfId":1092,"rarity":"FREE"},{"name":"Súcubo","dbfId":592,"rarity":"FREE"},{"name":"Fuego de alma","dbfId":974,"rarity":"FREE"},{"name":"Humildad","dbfId":854,"rarity":"FREE"},{"name":"Mano de protección","dbfId":727,"rarity":"FREE"},{"name":"Rabioso Gurubashi","dbfId":768,"rarity":"FREE"},{"name":"Torbellino","dbfId":636,"rarity":"FREE"},{"name":"Cazamareas múrloc","dbfId":976,"rarity":"FREE"},{"name":"Oráculo Malaescama","dbfId":510,"rarity":"FREE"},{"name":"Matar","dbfId":296,"rarity":"FREE"},{"name":"Tótem Lengua de Fuego","dbfId":1008,"rarity":"FREE"},{"name":"Porrazo","dbfId":461,"rarity":"FREE"},{"name":"Mago de Dalaran","dbfId":175,"rarity":"FREE"},{"name":"Hablavientos","dbfId":178,"rarity":"FREE"},{"name":"Hoja de la noche","dbfId":670,"rarity":"FREE"},{"name":"Bloquear con escudo","dbfId":1023,"rarity":"FREE"},{"name":"Palabra de Sombras: muerte","dbfId":1363,"rarity":"FREE"},{"name":"Sacrificio pactado","dbfId":163,"rarity":"FREE"},{"name":"Esfumarse","dbfId":196,"rarity":"FREE"},{"name":"Élite Kor\'kron","dbfId":28,"rarity":"FREE"},{"name":"Compañero animal","dbfId":437,"rarity":"FREE"}]');

			basicsJSON.forEach(basicCard => {
					update.push(basicCard);
			});
		}

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
