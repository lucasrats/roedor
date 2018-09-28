'use strict'

//importamos librerías
var mongoose = require('mongoose');
// express importamos directamente el fichero app.js que hemos configurado
//var app = require('./app');
var bodyParser = require('body-parser');

var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

// cargamos rutas
var user_routes = require('./routes/user');
var follow_routes = require('./routes/follow');
var publication_routes = require('./routes/publication');
var message_routes = require('./routes/message');
var game_routes = require('./routes/game');
var tournament_routes = require('./routes/tournament');
var match_routes = require('./routes/match');
var notification_routes = require('./routes/notification');
//socket.io
/*
app.get('/socket', function(req, res){
  res.sendFile(__dirname + '/index.html');
});
*/
io.on('connection', function(socket){
  /*
  socket.join('tournamentHS');
  console.log('a user connected:' + socket.id + " | en la tournamentHS");

  socket.in("tournamentHS").emit('connectToRoom', "Se ha conectado el usuario " + socket.id);

  socket.on('new-chat', function(chat){
    socket.in("tournamentHS").emit('new-chat', {chat});
  });
  */

  //creamos dinámicamente los rooms
  let referer = socket.handshake.headers.referer;
  let room = "";

  if(referer.indexOf("match/")){
    room = referer.substring(referer.indexOf("match") + 6, referer.length);
  }
  else if(referer.indexOf("lobby")){
    room = referer.substring(referer.indexOf("tournament") + 11, referer.indexOf("lobby") - 1);
  }
  //console.log(room);
  socket.join(room);

  socket.in(room).emit('connectToRoom', "Se ha conectado el usuario " + socket.id);

  socket.on('new-chat', function(chat){
    socket.in(room).emit('new-chat', {chat});
  });

  socket.on('opponent-confirm', function(){
    socket.in(room).emit('opponent-confirm');
  });

  socket.on('opponent-classes', function(){
    socket.in(room).emit('opponent-classes');
  });

  socket.on('opponent-bans', function(){
    socket.in(room).emit('opponent-bans');
  });

  socket.on('new-notification', function(type_notification){
    socket.in(room).emit('new-notification', type_notification);
  });

});

/*
var nsp = io.of('/tournamentHS');
nsp.on('connection', function(socket){
  console.log('someone connected: ' + socket.id);
});
nsp.emit('hi', 'everyone!');
*/

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

var port = 3800;

// conexión a DB
mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost:27017/roedor')
		.then(() => {
			console.log("Hola! La conexión a la base de datos roedor se ha realizado correctamente.");

			// creamos servidor
			http.listen(port, () => {
				console.log("Servidor corriendo en http://localhost:3800");
			});
		})
		.catch(err => console.log(err));
