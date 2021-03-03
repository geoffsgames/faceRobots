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
  socket.on('newPlayer', function(msg) {
    players[socket.id] = msg;
    sokID += 1;
    io.emit('newRival', msg)
  });
  
  socket.on('playerShapeChanged', function(msg){
    io.emit('rivalChanged', msg);
  });
  
  socket.on('jumping', function(msg){
	  io.emit("acceptJumpToPVP", msg)
  });
  
  socket.on('jumpToPVPAccepted', function(msg){
	  io.emit("jumpToPVP", msg)
  })

});

http.listen(port, function(){
  console.log('listening on *:' + port);
});
