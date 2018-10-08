'use strict'

var bcrypt = require('bcrypt-nodejs');
var mongoosePaginate = require('mongoose-pagination');
var fs = require('fs');
var path = require('path');
var User = require('../models/user');
var Follow = require('../models/follow');
var Device = require('../models/device');
var Publication = require('../models/publication');
var jwt = require('../services/jwt');
var moment = require('moment');

function saveUser(req, res){
	//recogemos los datos que nos llegan por post
	var params = req.body;
	var user = new User();

	if(params.nick && params.email && params.password){
		user.nick = params.nick;
		user.email = params.email;
		user.role = 'ROLE_USER';
		user.image = null;
		user.created_at = moment().format();
		user.active = false;
		user.token = 'tokenprueba';

		//comprobamos que no haya duplicados
		User.find({
			$or: [
				{email: user.email.toLowerCase()},
				{nick: user.nick.toLowerCase()}
			]
		}).exec((err, users) => {
			if(err) return res.status(500).send({message: 'Error al guardar el usuario'});

			if(users && users.length >= 1){
				return res.status(200).send({message: 'El email o el nick ya existen. Prueba con otros'});
			}else{
				// encriptamos la password con la librería de bcrypt
				bcrypt.hash(params.password, null, null, (err, hash) => {
					// si la función de callback devuelve el hash, lo actualizamos en el objeto user
					user.password = hash;

					user.save((err, userStored) => {
						if(err) return res.status(500).send({message: 'Error al guardar el usuario'});

						// si tenemos userStored, es que se ha realizado bien
						if(userStored){
							res.status(200).send({user: userStored});
						}else{
							res.status(404).send({message: 'No se ha registrado el usuario'});
						}
					});
				});
			}
		});



	}
	else{
		// si no llegan todos los obligatorios, devolvemos una respuesta
		res.status(200).send({
			message: 'Faltan campos obligatorios!!'
		});
	}
}

function loginUser(req, res){
	var params = req.body;

	var email = params.email;
	var password = params.password;

	User.findOne({
		email: email
	}, (err, user) => {
		if(err) return res.status(500).send({message: 'Error en la petición'});

		if(user){
			bcrypt.compare(password, user.password, (err, check) => {
				if(check){
					//devolver datos de usuario
					if(params.gettoken){
						//solo generar y devolver el token
						return res.status(200).send({
							token: jwt.createToken(user)
						});

					}else{
						user.password = undefined;
						return res.status(200).send({user});
					}

				}else{
					return res.status(404).send({message: 'El usuario no se ha podido loguear'});
				}
			});
		}else{
			return res.status(404).send({message: 'El usuario no se ha podido loguear!!'});
		}
	});
}

// Conseguir datos de un usuario
function getUser(req, res){

	var userId = req.params.id;

	User.findById(userId, (err, user) => {
		if(err) return res.status(500).send({message: 'Error en la petición'});

		if(!user) return res.status(404).send({message: 'El usuario no existe'});

		/*
		Follow.findOne({'user': req.user.sub, 'followed': userId}).exec((err, follow) => {
			if(err) return res.status(500).send({message: 'Error al comprobar el seguimiento'});

			return res.status(200).send({user, follow});
		});
		*/

		followThisUser(req.user.sub, userId).then((value) => {
			user.password = undefined;
			return res.status(200).send({
				user,
				following: value.following,
				followed: value.followed
			});
		});

	});
}

//función asíncrona, que devuelve una promesa (then)
async function followThisUser(identity_user_id, user_id){
	//con el await le decimos que es una llamada síncrona, se tiene que esperar a que se recoja el follow y se devuelva
	/*
	var following = await Follow.findOne({'user': identity_user_id, 'followed': user_id}).exec((err, follow) => {
			if(err) return handleError(err);
			return follow;
		});
	*/
	try{
		var following = await Follow.findOne({ user: identity_user_id, followed: user_id}).exec().then((following) => {
	                return following;
            })
            .catch((err) => {
                return handleError(err);
            });

		var followed = await Follow.findOne({ user: user_id, followed: identity_user_id}).exec().then((followed) => {
                return followed;
            })
            .catch((err) => {
                return handleError(err);
            });

		return {
			following,
			followed
		}
	} catch(err){
        return handleError(err);
    }
}

// Devolver un listado de usuarios paginado
function getUsers(req, res){
	// en el middleware bindeamos una referencia de User en la request
	var identity_user_id = req.user.sub;
	var itemsPerPage = 5;

	var page = 1;
	if(req.params.page){
		page = req.params.page;
	}

	User.find().sort('_id').paginate(page, itemsPerPage, (err, users, total) => {
		if(err) return res.status(500).send({message: 'Error en la petición'});

		if(!users) return res.status(404).send({message: 'No existen usuarios'});

		followUserIds(identity_user_id).then((value) => {
			return res.status(200).send({
				users,
				users_following: value.following,
				users_followers: value.followed,
				total,
				pages: Math.ceil(total / itemsPerPage),
			});

		});
	});
}

async function followUserIds(user_id){

	try{
		// con el select() podemos desactivar directamente campos que no queremos
		var following = await Follow.find({"user": user_id}).select({'_id': 0, '__v': 0, 'user': 0}).exec().then((follows) => {
		    var follows_clean = [];

			follows.forEach((follow) => {
				follows_clean.push(follow.followed);
			});

			return follows_clean;
		}).catch((err)=>{
			return handleError(err)
		});

		var followed = await Follow.find({"followed":user_id}).select({'_id':0, '__v':0, 'followed':0}).exec().then((follows)=>{
			var follows_clean = [];

			follows.forEach((follow) => {
				follows_clean.push(follow.user);
			});

			return follows_clean;
		}).catch((err)=>{
			return handleError(err)
		});

		return {
			following,
			followed
		}
	}
	catch(e){
    	console.log(e);
    }

}

// devolver contadores de seguidores y gente que seguimos
function getCounters(req, res){
	var userId = req.user.sub;

	if(req.params.id){
		var userId = req.params.id;
	}

	getCountFollow(userId).then((value) => {
		return res.status(200).send(value);
	});

}

async function getCountFollow(user_id){
	var following = await Follow.count({'user': user_id}).exec().then((count) => {
		return count;
	}).catch((err) => {
		return handleError(err);
	});

	var followers = await Follow.count({'followed': user_id}).exec().then((count) => {
		return count;
	}).catch((err) => {
		return handleError(err);
	});

	var publications = await Publication.count({'user': user_id}).exec().then((count) => {
		return count;
	}).catch((err) => {
		return handleError(err);
	});

	return {
		following,
		followers,
		publications
	}
}

// Actualizar los datos de un usuario
function updateUser(req, res){
	var userId = req.params.id;
	var update = req.body;

	//eliminamos la password del objeto update, porque deberemos hacerlo mejor en un método aparte
	//update.password = undefined;
	delete update.password;

	if(userId != req.user.sub){
		return res.status(500).send({message: 'No tienes permiso para actualizar este usuario'});
	}

	User.find({
		$or: [
			{email: update.email.toLowerCase()},
			{nick: update.nick.toLowerCase()}
		]
	}).exec((err, users) => {

		var user_isset = false;
		users.forEach((user) => {
			if(user && user._id != userId) user_isset = true;
		});

		if(user_isset) return res.status(404).send({message: 'Los datos ya están en uso'});

		//con el tecer parámetro, new, indicamos si queremos que en la respuesta del callback nos devuelva el nuevo objeto, o el anterior actualizado
		User.findByIdAndUpdate(userId, update, {new: true}, (err, userUpdate) => {
			if(err) return res.status(500).send({message: 'Error en la petición'});

			if(!userUpdate) return res.status(404).send({message: 'No se ha podido actualizar el usuario'});

			return res.status(200).send({user: userUpdate});
		});
	});
}

// Actualizar avatar de usuario
function uploadImage(req, res){
	var userId = req.params.id;

	if(req.files){
		var file_path = req.files.image.path;
		var file_split = file_path.split('/');
		var file_name = file_split[2];
		var ext_split = file_name.split('\.');
		var file_ext = ext_split[1];

		if(userId != req.user.sub){
			removeFilesOfUploads(res, file_path, 'No tienes permiso para actualizar este usuario');
		}

		if(file_ext == 'png' || file_ext == 'jpg' || file_ext == 'jpeg'){
			//Si la imagen es válida, actualizamos el avatar
			User.findByIdAndUpdate(userId, {image: file_name}, {new: true}, (err, userUpdated) =>{
				if(err) return res.status(500).send({message: 'Error en la petición'});

				if(!userUpdated) return res.status(404).send({message: 'No se ha podido actualizar el usuario'});

				return res.status(200).send({user: userUpdated});
			});
		}else{
			//borramos el fichero
			removeFilesOfUploads(res, file_path, 'Extensión no válida');
		}
	}
	else{
		return res.status(200).send({message: 'No se ha subido ninguna imagen.'});
	}
}

function removeFilesOfUploads(res, file_path, message){
	fs.unlink(file_path, (err) => {
		return res.status(200).send({message})
	});
}

function getImageFile(req, res){
	var image_file = req.params.imageFile;
	var path_file = './uploads/users/' + image_file;

	fs.exists(path_file, (exists) => {
		if(exists){
			res.sendFile(path.resolve(path_file));
		}else{
			res.status(200).send({message: 'No existe la imagen...'});
		}
	});
}

function saveDevice(req, res){

	var params = req.body;
	var device = new Device();
	if(params.serial){

		device.serial = params.serial;
		device.user = req.user.sub;

		device.save((err, deviceStored) => {
			if(err) return res.status(500).send({message: 'Error al guardar el dispositivo.'});

			if(deviceStored){
				return res.status(200).send({device: deviceStored});
			}else{
				return res.status(404).send({message: 'No se ha podido registrar el dispositivo.'});
			}
		});
	}
	else{
		return res.status(200).send({
			message: 'Falta indicar el dispositivo.'
		});
	}
}

function getDevices(req, res){

	var id_user = req.user.sub;

	Device.find({user: id_user}, (err, devices) => {
		if(err) return res.status(500).send({message: 'Error en la petición'});

		if(!devices) return res.status(404).send({message: 'No existen dispositivos para el usuario'});

		return res.status(200).send({devices: devices});

	});

}


module.exports = {
	saveUser,
	loginUser,
	getUser,
	getUsers,
	updateUser,
	uploadImage,
	getImageFile,
	getCounters,
	saveDevice,
	getDevices
}
