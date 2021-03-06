'use strict'

var express = require('express');
var UserController = require('../controllers/user');

// cargamos los métodos de express para usar POST, GET, PUT, etc
var api = express.Router();
var md_auth = require('../middlewares/authenticated');

var multipart = require('connect-multiparty');
var md_upload = multipart({uploadDir: './uploads/users'})

// definimos las rutas, invocando las funciones del controlador
api.post('/register', UserController.saveUser);
api.post('/login', UserController.loginUser);
api.get('/user/:id', md_auth.ensureAuth, UserController.getUser);
api.post('/register-device', md_auth.ensureAuth, UserController.saveDevice);
// con la ? indicamos que el parámetro es opcional
api.get('/users/:page?', md_auth.ensureAuth, UserController.getUsers);
api.get('/counters/:id?', md_auth.ensureAuth, UserController.getCounters);
// put para actualizar
api.put('/update-user/:id', md_auth.ensureAuth, UserController.updateUser);
api.post('/upload-image-user/:id', [md_auth.ensureAuth, md_upload], UserController.uploadImage);
api.get('/get-image-user/:imageFile', UserController.getImageFile);
api.get('/user-devices', md_auth.ensureAuth, UserController.getDevices);
api.post('/user-activate', UserController.activateUserRegistration);
api.post('/user-device', md_auth.ensureAuth, UserController.removeDevice);
api.post('/send-token-reboot', UserController.sendTokenReboot);
api.post('/new-password-by-token', UserController.newPasswordByToken);

module.exports = api;
