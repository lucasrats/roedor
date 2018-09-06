'use strict'

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var ParticipantSchema = Schema({
	tournament: { type: Schema.ObjectId, ref: 'Tournament'},
	user: { type: Schema.ObjectId, ref: 'User'},
	last_updated: String,
	checkin: Boolean,
	packs: Number,
	cards_pool: String,
	decks: String
});

module.exports = mongoose.model('Participant', ParticipantSchema);