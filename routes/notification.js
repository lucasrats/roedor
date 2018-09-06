'use strict'

var express = require('express');
var NotificationController = require('../controllers/notification');
var api = express.Router();
var md_auth = require('../middlewares/authenticated');

// definimos las rutas, invocando las funciones del controlador
api.post('/notification', md_auth.ensureAuth, NotificationController.saveNotification);
api.get('/notifications', md_auth.ensureAuth, NotificationController.getNotifications);
api.get('/unviewed-notifications', md_auth.ensureAuth, NotificationController.getUnviewedNotifications);
api.post('/set-viewed-notification', md_auth.ensureAuth, NotificationController.setViewedNotification);

module.exports = api;
