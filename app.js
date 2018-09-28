//Configuración gorda de Express
'use strict'

var express = require('express');
var bodyParser = require('body-parser');

var app = express();

// cargamos rutas
var user_routes = require('./routes/user');
var follow_routes = require('./routes/follow');
var publication_routes = require('./routes/publication');
var message_routes = require('./routes/message');
var game_routes = require('./routes/game');
var tournament_routes = require('./routes/tournament');
var match_routes = require('./routes/match');
var notification_routes = require('./routes/notification');

// middlewares. Ejecución pre-controlador
app.use(bodyParser.urlencoded({extended:false}));
//convertimos lo que nos llega a json
app.use(bodyParser.json());

// configurar cabeceras http y cors
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Authorization, X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Request-Method');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    res.header('Allow', 'GET, POST, OPTIONS, PUT, DELETE');

    next();
});

// rutas
// reescribimos las rutas del user_routes, anteponiendo un /api
app.use('/api', user_routes);
app.use('/api', follow_routes);
app.use('/api', publication_routes);
app.use('/api', message_routes);
app.use('/api', game_routes);
app.use('/api', tournament_routes);
app.use('/api', match_routes);
app.use('/api', notification_routes);

// exportamos la configuración
module.exports = app;
