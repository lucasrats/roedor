'use strict'

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var TournamentSchema = Schema({
	name: String,
	game: { type: Schema.ObjectId, ref: 'Game'},
	created_by: { type: Schema.ObjectId, ref: 'User'},
	start_date: String,
	max_players: Number,
	type: String,
	rules: String,
	active: Boolean,
	week: Number,
	bans: Number,
	bo: Number,
	lower_bracket: Boolean,
	draft: Number,
	chat: String,
	byes: String
});

module.exports = mongoose.model('Tournament', TournamentSchema);
