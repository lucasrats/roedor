'use strict'

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var GameSchema = Schema({
	name: String,
	image: String
});

module.exports = mongoose.model('Game', GameSchema);