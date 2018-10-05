'use strict'

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var DeviceSchema = Schema({
	user: { type: Schema.ObjectId, ref: 'User'},
	serial: String
});

module.exports = mongoose.model('Device', DeviceSchema);
