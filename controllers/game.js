'use strict'

var mongoosePaginate = require('mongoose-pagination');
var fs = require('fs');
var path = require('path');
var Game = require('../models/game');

function saveGame(req, res){

	var params = req.body;
	var game = new Game();

	if(params.name){
		game.name = params.name;
		game.image = null;

		Game.find({name: game.name.toLowerCase()}).exec((err, games) => {
			if(err) return res.status(500).send({message: 'Error al guardar el juego'});

			if(games && games.length >= 1){
				return res.status(200).send({message: 'Ya existe un juego dado de alta con ese nombre.'});
			}

			game.save((err, gameStored) => {
				if(err) return res.status(500).send({message: 'Error al guardar el juego'});

				if(gameStored){
					res.status(200).send({game: gameStored});
				}else{
					res.status(404).send({message: 'No se ha registrado el juego.'});
				}
			});
		});
	}
	else{
		res.status(200).send({
			message: 'Falta indicar el nombre del juego. Por favor, revísalo.'
		});
	}
}

function getGame(req, res){

	var gameId = req.params.id;

	Game.findById(gameId, (err, game) => {
		if(err) return res.status(500).send({message: 'Error en la petición'});

		if(!game) return res.status(404).send({message: 'El juego no existe'});

		return res.status(200).send({game});
		
	});

}

function getGames(req, res){

	Game.find((err, games) => {
		if(err) return res.status(500).send({message: 'Error en la petición'});

		if(!games) return res.status(404).send({message: 'No existen juegos'});

		return res.status(200).send({games});
	})

}

function updateGame(req, res){

	var update = req.body;
	var gameId = req.params.id;

	Game.find({name: update.name.toLowerCase()}).exec((err, games) => {

		var game_isset = false;
		games.forEach((game) => {
			if(game && game._id != gameId) game_isset = true;
		});

		if(game_isset) return res.status(404).send({message: 'Los datos ya están en uso'});

		//con el tecer parámetro, new, indicamos si queremos que en la respuesta del callback nos devuelva el nuevo objeto, o el anterior actualizado
		Game.findByIdAndUpdate(gameId, update, {new: true}, (err, gameUpdate) => {
			if(err) return res.status(500).send({message: 'Error en la petición'});

			if(!gameUpdate) return res.status(404).send({message: 'No se ha podido actualizar el juego'});

			return res.status(200).send({game: gameUpdate});
		});
	});

}

module.exports = {
	saveGame,
	getGame,
	getGames,
	updateGame
}