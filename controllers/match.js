'use strict'

var path = require('path');
var Match = require('../models/match');
var User = require('../models/user');
var Tournament = require('../models/tournament');
var Participant = require('../models/participant');
var Device = require('../models/device');
var moment = require('moment');

function getMatches(req, res){
	// en el middleware bindeamos una referencia de User en la request
	var identity_user_id = req.user.sub;
	var itemsPerPage = 15;

	var page = 1;
	if(req.params.page){
		page = req.params.page;
	}

	Match.find({ $or:[{"home": identity_user_id}, {"away": identity_user_id}]}).sort('match_date').paginate(page, itemsPerPage).populate('tournament home away').exec((err, matches, total) => {
		if(err) return res.status(500).send({message: 'Error en la petición'});

		if(!matches) return res.status(404).send({message: 'No existen partidos'});

		return res.status(200).send({
			matches,
			total,
			pages: Math.ceil(total / itemsPerPage),
		});

	});

}

function getMatch(req, res){

	var matchId = req.params.id;

	Match.findById(matchId).populate('tournament home away').exec((err, match) => {
		if(err) return res.status(500).send({message: 'Se ha producido un error'});

		if(match){
			res.status(200).send({match: match});
		}else{
			res.status(404).send({message: 'Error al recuperar el partido'});
		}
	});
}

function addChatMatch(req, res){

	var matchId = req.params.id;
	var update = req.body;
	var dateWrote = moment().unix();

	Match.findById(matchId, (err, match) => {
		if(err) return res.status(500).send({message: err});

		if(!match) return res.status(404).send({message: 'No existe ese partido'});

		let user = update.system ? 'Sistema' : req.user.nick;
		if(!match.chat){
			var chatToStore = JSON.stringify([{user: user, text: update.chat, date: dateWrote}]);
		}
		else{
			var actualChat = JSON.parse(match.chat);
			actualChat.push({user: user, text: update.chat, date: dateWrote});
			var chatToStore = JSON.stringify(actualChat);
		}


		Match.update({_id: matchId}, { chat: chatToStore }, { multi: false }, (err, matchtUpdated) => {
			if(err) return res.status(500).send({message: err});

			if(!matchtUpdated) return res.status(404).send({message: 'Ocurrió un error al guardar el chat'});

			let urlMatch = 'https://roedor.net/tournament/' + match.tournament + '/match/' + matchId;
			//comprobamos a qué devices tenemos que enviarle la notificación push
			var message = {
			  app_id: "7094c9b9-5033-4055-ac33-4a09e39f63d8",
			  contents: {"en": "Nuevo chat en partido"},
			  include_player_ids: [],
				url: urlMatch
			};
			//TODO arreglar con async-await
			if(req.user.sub == match.home){
				Device.find({"user": match.away}).exec((err, devices) => {
					if(err) return res.status(500).send({message: err});

					if(!devices) return res.status(404).send({message: 'No se encuentran dispositivos'});

					devices.forEach(device => {
						message.include_player_ids.push(device.serial);
					});
					sendNotification(message);
				});
			}
			else if(req.user.sub == match.away){
				Device.find({"user": match.home}).exec((err, devices) => {
					if(err) return res.status(500).send({message: err});

					if(!devices) return res.status(404).send({message: 'No se encuentran dispositivos'});

					devices.forEach(device => {
						message.include_player_ids.push(device.serial);
					});
					sendNotification(message);
				});
			}
			else{
				Device.find({ $or:[{"user": match.home}, {"user": match.away}]}).exec((err, devices) => {
					if(err) return res.status(500).send({message: err});

					if(!devices) return res.status(404).send({message: 'No se encuentran dispositivos'});
					devices.forEach(device => {
						message.include_player_ids.push(device.serial);
					});
					sendNotification(message);
				});
			}

			//enviamos notificación push al adversario
			//sendNotification(message);
			return res.status(200).send({chat: {user: user, text: update.chat, date: dateWrote}});
		});
	});
}

function sendResult(req, res){

	var matchId = req.params.id;
	var result = req.body;
	var userId = req.user.sub;
	var manageTournament = false;
	var tournamentType = 'swiss';

	Match.findById(matchId, (err, match) => {
		if(err) return res.status(500).send({message: err});

		if(!match) return res.status(404).send({message: 'No existe ese partido'});

		manageTournament = Tournament.findOne({_id: match.tournament, created_by: userId}, (err, tournament) => {
			if(err) return res.status(500).send({message: err});

			if(tournament){
				manageTournament = true;
				tournamentType = tournament.type;
			}
		});

		if(userId == match.home || userId == match.away || manageTournament){

			Match.findOneAndUpdate({_id: matchId}, { homeScore: result.homeScore, awayScore: result.awayScore, status: 4 , reporter: req.user.sub }, { new:true }).exec((err, matchtUpdated) => {
				if(err) return res.status(500).send({message: err});

				if(!matchtUpdated) return res.status(404).send({message: 'Ocurrió un error al guardar el partido'});

				//si el tipo de torneo es KO, rellenamos la siguiente ronda
				if(tournamentType == 'ko'){
					Match.findOne({tournament: match.tournament, this_round: match.go_round}).exec((err, matchNext) => {
						if(err) return res.status(500).send({message: err});

						if(!matchNext) return res.status(404).send({message: 'No existe ese partido'});

						let winner = (matchtUpdated.homeScore > matchtUpdated.awayScore) ? matchtUpdated.home : matchtUpdated.away;
						let loser = (matchtUpdated.homeScore < matchtUpdated.awayScore) ? matchtUpdated.home : matchtUpdated.away;

						//tengamos en cuenta que si el admin tiene que rectificar un resultado, ha de verse reflejado en el siguiente partido también
						if((matchNext.home + '') == (loser + '')){
							matchNext.home = winner;
						}
						else if((matchNext.away + '') == (loser + '')){
							matchNext.away = winner;
						}
						else if(!matchNext.home){
							matchNext.home = winner;
						}
						else if(!matchNext.away){
							matchNext.away = winner;
						}
						matchNext.status = 4;
						matchNext.reporter = req.user.sub;

						matchNext.save((err, matchStored) => {
							if(err) return res.status(500).send({message: err});

							if(!matchStored) res.status(404).send({message: 'Ha ocurrido un error al registrar el partido.'});

							return res.status(200).send({match: matchtUpdated});
						});

					});
				}

				return res.status(200).send({match: matchtUpdated});

			});

		}
		else{
			return res.status(404).send({message: 'No participas en ese partido'});
		}

	});
}

function confirmMatch(req, res){

	var matchId = req.params.id;
	var userId = req.user.sub;
	let toUpdate;

	Match.findById(matchId, (err, match) => {
		if(err) return res.status(500).send({message: err});

		if(!match) return res.status(404).send({message: 'No existe ese partido'});

		if(userId == match.home){
			//comprobamos si el contrincante ya hizo el checkin
			if(match.awayAccept){
				toUpdate = {homeAccept: true, status: 1};
			}
			else{
				toUpdate = {homeAccept: true};
				//avisamos al contrincante de que se ha hecho checkin
				let urlMatch = 'https://roedor.net/tournament/' + match.tournament + '/match/' + matchId;
				//comprobamos a qué devices tenemos que enviarle la notificación push
				var message = {
				  app_id: "7094c9b9-5033-4055-ac33-4a09e39f63d8",
				  contents: {"en": "Un partido está pendiente de tu checkin"},
				  include_player_ids: [],
					url: urlMatch
				};
				//TODO arreglar con async-await
				Device.find({"user": match.away}).exec((err, devices) => {
					if(err) return res.status(500).send({message: err});

					if(!devices) return res.status(404).send({message: 'No se encuentran dispositivos'});

					devices.forEach(device => {
						message.include_player_ids.push(device.serial);
					});
					sendNotification(message);
				});
			}

			Match.findOneAndUpdate({_id: matchId}, toUpdate, { new:true }).populate('home away').exec((err, matchtUpdated) => {
				if(err) return res.status(500).send({message: err});

				if(!matchtUpdated) return res.status(404).send({message: 'Ocurrió un error al aceptar el partido'});

				return res.status(200).send({match: matchtUpdated});
			});
		}else if(userId == match.away){

			if(match.homeAccept){
				toUpdate = {awayAccept: true, status: 1};
			}
			else{
				toUpdate = {awayAccept: true};
				//avisamos al contrincante de que se ha hecho checkin
				let urlMatch = 'https://roedor.net/tournament/' + match.tournament + '/match/' + matchId;
				//comprobamos a qué devices tenemos que enviarle la notificación push
				var message = {
				  app_id: "7094c9b9-5033-4055-ac33-4a09e39f63d8",
				  contents: {"en": "Un partido está pendiente de tu checkin"},
				  include_player_ids: [],
					url: urlMatch
				};
				//TODO arreglar con async-await
				Device.find({"user": match.home}).exec((err, devices) => {
					if(err) return res.status(500).send({message: err});

					if(!devices) return res.status(404).send({message: 'No se encuentran dispositivos'});

					devices.forEach(device => {
						message.include_player_ids.push(device.serial);
					});
					sendNotification(message);
				});
			}

			Match.findOneAndUpdate({_id: matchId}, toUpdate, { new:true }).populate('home away').exec((err, matchtUpdated) => {
				if(err) return res.status(500).send({message: err});

				if(!matchtUpdated) return res.status(404).send({message: 'Ocurrió un error al aceptar el partido'});

				return res.status(200).send({match: matchtUpdated});
			});
		}
		else{
			return res.status(404).send({message: 'No participas en ese partido'});
		}

	});
}

function classesSelect(req, res){

		var matchId = req.params.id;
		var classes = req.body;
		var userId = req.user.sub;

		Match.findById(matchId, (err, match) => {
			if(err) return res.status(500).send({message: err});

			if(!match) return res.status(404).send({message: 'No existe ese partido'});

			if(!match.metadata){
				var metadata = {};
			}else{
				var metadata = JSON.parse(match.metadata);
			}

			if(userId == match.home){
				metadata.homeClasses = classes;
			}else if(userId == match.away){
				metadata.awayClasses = classes;
			}
			else{
				return res.status(404).send({message: 'No participas en ese partido'});
			}

			//var arr_classesHS = ['checkSelBrujo','checkSelCazador','checkSelChaman','checkSelDruida','checkSelGuerrero','checkSelMago','checkSelPaladin','checkSelPicaro','checkSelSacerdote'];
			var metachurro = JSON.stringify(metadata);
			var toUpdate;
			if(metadata.homeClasses && metadata.awayClasses){
				Tournament.findById(match.tournament, (err, tournament) => {
					if(err) return res.status(500).send({message: err});

					if(!tournament) return res.status(404).send({message: 'No existe ese torneo'});

					if(tournament.bans == 0){
						toUpdate = { metadata: metachurro, status: 3 };
					}
					else{
						toUpdate = { metadata: metachurro, status: 2 };
					}
					Match.findOneAndUpdate({_id: matchId}, toUpdate, { new:true }).populate('home away').exec((err, matchtUpdated) => {
						if(err) return res.status(500).send({message: err});

						if(!matchtUpdated) return res.status(404).send({message: 'Ocurrió un error al aceptar el partido'});

						return res.status(200).send({match: matchtUpdated});
					});

				});
			}
			else{
				toUpdate = { metadata: metachurro };
				var userToSend;
				if(userId == match.home){
					userToSend = match.away;
				}
				else{
					userToSend = match.home;
				}
				//avisamos al contrincante de que se ha hecho checkin
				let urlMatch = 'https://roedor.net/tournament/' + match.tournament + '/match/' + matchId;
				//comprobamos a qué devices tenemos que enviarle la notificación push
				var message = {
				  app_id: "7094c9b9-5033-4055-ac33-4a09e39f63d8",
				  contents: {"en": "Tu rival ha seleccionado sus clases"},
				  include_player_ids: [],
					url: urlMatch
				};
				//TODO arreglar con async-await
				Device.find({"user": userToSend}).exec((err, devices) => {
					if(err) return res.status(500).send({message: err});

					if(!devices) return res.status(404).send({message: 'No se encuentran dispositivos'});

					devices.forEach(device => {
						message.include_player_ids.push(device.serial);
					});
					sendNotification(message);

					Match.findOneAndUpdate({_id: matchId}, toUpdate, { new:true }).populate('home away').exec((err, matchtUpdated) => {
						if(err) return res.status(500).send({message: err});

						if(!matchtUpdated) return res.status(404).send({message: 'Ocurrió un error al aceptar el partido'});

						return res.status(200).send({match: matchtUpdated});
					});

				});
			}

			//Match.update({_id: matchId}, query, { multi: false }, (err, matchtUpdated) => {
		});

}

function classesBan(req, res){

		var matchId = req.params.id;
		var bans = req.body;
		var userId = req.user.sub;

		Match.findById(matchId, (err, match) => {
			if(err) return res.status(500).send({message: err});

			if(!match) return res.status(404).send({message: 'No existe ese partido'});

			if(!match.metadata){
				var metadata = {};
			}else{
				var metadata = JSON.parse(match.metadata);
			}

			if(userId == match.home){
				metadata.awayClassesFinal = [];
				metadata.homeClassesBan = bans;
				metadata.awayClasses.forEach(classBan => {
					if(!metadata.homeClassesBan.find(function(element){
						//console.log(element.name + ' vs ' + classBan.name);
					  return element.name == classBan.name}
					)){
						metadata.awayClassesFinal.push(classBan);
					}
				});

			}else if(userId == match.away){
				metadata.homeClassesFinal = [];
				metadata.awayClassesBan = bans;
				metadata.homeClasses.forEach(classBan => {
					if(!metadata.awayClassesBan.find(function(element){
						//console.log(element.name + ' vs ' + classBan.name);
					  return element.name == classBan.name}
					)){
						metadata.homeClassesFinal.push(classBan);
					}
				});
			}
			else{
				return res.status(404).send({message: 'No se han seleccionado clases anteriormente. Consulta con el administrador.'});
			}

			var metachurro = JSON.stringify(metadata);
			let toUpdate;

			if(metadata.homeClassesBan && metadata.awayClassesBan){
				toUpdate = { metadata: metachurro, status: 3 };
			}
			else{
				toUpdate = { metadata: metachurro };
				var userToSend;
				if(userId == match.home){
					userToSend = match.away;
				}
				else{
					userToSend = match.home;
				}
				//avisamos al contrincante de que se ha hecho checkin
				let urlMatch = 'https://roedor.net/tournament/' + match.tournament + '/match/' + matchId;
				//comprobamos a qué devices tenemos que enviarle la notificación push
				var message = {
				  app_id: "7094c9b9-5033-4055-ac33-4a09e39f63d8",
				  contents: {"en": "Tu rival ha baneado clases"},
				  include_player_ids: [],
					url: urlMatch
				};
				//TODO arreglar con async-await
				Device.find({"user": userToSend}).exec((err, devices) => {
					if(err) return res.status(500).send({message: err});

					if(!devices) return res.status(404).send({message: 'No se encuentran dispositivos'});

					devices.forEach(device => {
						message.include_player_ids.push(device.serial);
					});
					sendNotification(message);
				});
			}

			Match.findOneAndUpdate({_id: matchId}, toUpdate, { new:true }).populate('home away').exec((err, matchtUpdated) => {
				if(err) return res.status(500).send({message: err});

				if(!matchtUpdated) return res.status(404).send({message: 'Ocurrió un error al aceptar el partido'});

				return res.status(200).send({match: matchtUpdated});
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
	getMatches,
	getMatch,
	addChatMatch,
	sendResult,
	confirmMatch,
	classesSelect,
	classesBan
}
