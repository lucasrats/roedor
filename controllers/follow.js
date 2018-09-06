'use strict'

//var path = require('path');
//var fs = require('fs');
var mongoosePaginate = require('mongoose-pagination');

var User = require('../models/user');
var Follow = require('../models/follow');

function saveFollow(req, res){

	var params = req.body;

	var follow = new Follow();
	follow.user = req.user.sub;
	follow.followed = params.followed;

	follow.save((err, followStored) => {
		if(err) return res.status(500).send({message: 'Error al guardar el follow'});

		if(!followStored) return res.status(404).send({message: 'No se ha guardado el follow'});

		return res.status(200).send({follow: followStored});

	});

}

function deleteFollow(req, res){
	var userId = req.user.sub;
	var unfollowId = req.params.id;

	Follow.find({'user': userId, 'followed': unfollowId}).remove(err => {
		if(err) return res.status(500).send({message: 'Error al guardar el unfollow'});

		return res.status(200).send({message: 'Se ha realizado el unfollow!!'});
	});
}

function getFollowingUsers(req, res){
	var userId = req.user.sub;
	// si nos llega id por la url, listaremos los follows de ese usuario, si no, los del usuario logado
	if(req.params.id && req.params.page){
		userId = req.params.id;
	}

	var page = 1;
	if(req.params.page){
		page = req.params.page;
	}else{
		page = req.params.id;
	}

	var itemsPerPage = 3;

	Follow.find({user: userId}).populate({path: 'followed'}).paginate(page, itemsPerPage, (err, follows, total) => {
		if(err) return res.status(500).send({message: 'Error al guardar el unfollow'});

		if(!follows) return res.status(404).send({message: 'No sigues a ningún usuario'});

		followUserIds(userId).then((value) => {
			return res.status(200).send({
				total,
				pages: Math.ceil(total / itemsPerPage),
				follows,
				users_following: value.following,
				users_followers: value.followed
			});
		});
	});
}

function getFollowedUsers(req, res){
	var userId = req.user.sub;

	if(req.params.id && req.params.page){
		userId = req.params.id;
	}

	var page = 1;
	if(req.params.page){
		page = req.params.page;
	}else{
		page = req.params.id;
	}

	var itemsPerPage = 3;

	Follow.find({followed: userId}).populate('user followed').paginate(page, itemsPerPage, (err, follows, total) => {
		if(err) return res.status(500).send({message: 'Error en el servidor'});

		if(!follows) return res.status(404).send({message: 'No te sigue ningún usuario'});

		followUserIds(userId).then((value) => {
			return res.status(200).send({
				total,
				pages: Math.ceil(total / itemsPerPage),
				follows,
				users_following: value.following,
				users_followers: value.followed
			});
		});
	});
}

// Devolver usuarios que sigo
function getMyFollows(req, res){
	var userId = req.user.sub;

	Follow.find({user: userId}).populate('user followed').exec((err, follows) => {
		if(err) return res.status(500).send({message: 'Error en el servidor'});

		if(!follows) return res.status(404).send({message: 'No sigues a ningún usuario'});

		return res.status(200).send({follows});
	});
}

// Devolver usuarios que me siguen
function getFollowBacks(req, res){
	var userId = req.user.sub;

	Follow.find({followed: userId}).populate('user followed').exec((err, follows) => {
		if(err) return res.status(500).send({message: 'Error en el servidor'});

		if(!follows) return res.status(404).send({message: 'No te sigue ningún usuario'});

		return res.status(200).send({follows});
	});
}

async function followUserIds(user_id){

	try{
		// con el select() podemos desactivar directamente campos que no queremos
		var following = await Follow.find({"user": user_id}).select({'_id': 0, '__v': 0, 'user': 0}).exec().then((follows) => {
		    var follows_clean = [];

			follows.forEach((follow) => {
				follows_clean.push(follow.followed);
			});

			return follows_clean;
		}).catch((err)=>{
			return handleError(err)
		});

		var followed = await Follow.find({"followed":user_id}).select({'_id':0, '__v':0, 'followed':0}).exec().then((follows)=>{
			var follows_clean = [];

			follows.forEach((follow) => {
				follows_clean.push(follow.user);
			});

			return follows_clean;
		}).catch((err)=>{
			return handleError(err)
		});

		return {
			following,
			followed
		}
	}
	catch(e){
    	console.log(e);
    }

}

module.exports = {
	saveFollow,
	deleteFollow,
	getFollowingUsers,
	getFollowedUsers,
	getMyFollows,
	getFollowBacks
}