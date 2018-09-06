'use strict'

var jwt = require('jwt-simple');
var moment = require('moment');
//TODO - llevar la clave secreta a un fichero externo
var secret = 'clave_secreta_curso_mean_social';

exports.ensureAuth = function(req, res, next){
	if(!req.headers.authorization){
		return res.status(403).send({message: 'La petición no tiene la cabecera de autenticación'});
	}

	var token = req.headers.authorization.replace(/['"]+/g, '');
	//sacamos los datos codificados
	try{
		var payload = jwt.decode(token, secret);

		if(payload.exp <= moment().unix()){
			return res.status(401).send({message: 'El token ha expirado'});
		} 
	}catch(ex){
		return res.status(404).send({message: 'El token no es válido'});
	}

	//damos acceso a todos los controladores a los datos del usuario logado
	req.user = payload;

	next();

}