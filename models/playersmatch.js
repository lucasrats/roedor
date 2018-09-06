'use strict'

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var PlayersMatchSchema = Schema({
	match: {type: Schema.ObjectId, ref: 'Match'},
	homeUser: { type: Schema.ObjectId, ref: 'User'}, 
	awayUser: { type: Schema.ObjectId, ref: 'User'}
});

module.exports = mongoose.model('PlayersMatch', PlayersMatchSchema);