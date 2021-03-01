var express = require('express')
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var port = process.env.PORT || 3000;

app.use(express.static(__dirname));

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

const players = {}
var sokID = 0

io.on('connection', function(socket){
  socket.on('newPlayer', state => {
    console.log('New player joined with state:', state)
    players[socket.id] = sokID;
    sokID += 1;
  });
  socket.on('move', function(msg){
    io.emit('animate', {m: msg, s: players[socket.id]});
  });
});

http.listen(port, function(){
  console.log('listening on *:' + port);
});
