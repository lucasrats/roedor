'use strict'

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var MatchSchema = Schema({
	tournament: { type: Schema.ObjectId, ref: 'Tournament'},
	game: { type: Schema.ObjectId, ref: 'Game'},
	match_date: String,
	status: Number,
	reporter: { type: Schema.ObjectId, ref: 'User'},
	week: Number,
	group: Number,
	home: { type: Schema.ObjectId, ref: 'User'},
	away: { type: Schema.ObjectId, ref: 'User'},
	homeAccept: Boolean,
	awayAccept: Boolean,
	homeScore: Number,
	awayScore: Number,
	go_round: Number,
	this_round: Number,
	chat: String,
	metadata: Object
});

module.exports = mongoose.model('Match', MatchSchema);
