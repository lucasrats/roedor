'use strict'

var moment = require('moment');
var mongoose_paginated = require('mongoose-pagination');

var User = require('../models/user');
var Notification = require('../models/notification');

function saveNotification(req, res){
	var params = req.body;

	if(!params.receiver && !params.type && !params.url) return res.status(200).send({message: 'Envía los datos necesarios'});

	var notification = new Notification();
	notification.user = params.receiver;
	notification.status = 0;
	notification.type = params.type;
	notification.timestamp = moment().unix();
  notification.url = params.url;

	notification.save((err, notificationStored) => {
		if(err) return res.status(500).send({message: 'Error en la petición'});

		if(!notificationStored) return res.status(404).send({message: 'Error al enviar la notificación'});

		return res.status(200).send({message: notificationStored})
	});
}

function getNotifications(req, res){
	var userId = req.user.sub;
	Notification.find({user: userId, status : {$gte : 0, $lte : 1}}).populate('user').sort('-timestamp').exec((err, notifications) => {
		if(err) return res.status(500).send({message: 'Error en la petición'});

		if(!notifications) return res.status(200).send({message: 'No existen notificaciones'});

		let total = notifications.length;

		return res.status(200).send({
			notifications,
			total
		});
	});

}

function getUnviewedNotifications(req, res){
  /*
	var userId = req.user.sub;

	Message.count({receiver: userId, viewed: 'false'}).exec((err, count) => {
		if(err) return res.status(500).send({message: 'Error en la petición'});

		if(!count) return res.status(404).send({message: 'No existen mensajes'});

		return res.status(200).send({unviewed : count});
	});
  */
}

function setViewedNotification(req, res){
	var userId = req.user.sub;
	var params = req.body;

	if(params.id){
		Notification.update({_id: params.id}, {status: 2}, (err, notificationUpdated) => {
			if(err) return res.status(500).send({message: 'Error en la petición'});

			return res.status(200).send({
				notification: notificationUpdated
			})
		});
	}
}

module.exports = {
	saveNotification,
	getNotifications,
	getUnviewedNotifications,
	setViewedNotification
}
