'use strict'

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var NotificationSchema = Schema({
	user: { type: Schema.ObjectId, ref: 'User'},
	status: Number,
	type: String,
	timestamp: Number,
	url: String
});

module.exports = mongoose.model('Notification', NotificationSchema);
