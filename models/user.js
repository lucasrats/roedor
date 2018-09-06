'use strict'

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var UserSchema = Schema({
	nick: String,
	email: String,
	password: String,
	role: String,
	image: String,
	created_at: String,
	active: Boolean,
	token: String,
	battletag: String,
	steamid: String
});

// exportamos el modelo de Mongoose para User. La colección que se va a guardar en la BD será 'users', ya que se pluraliza automáticamente y se hace un lower
module.exports = mongoose.model('User', UserSchema);
