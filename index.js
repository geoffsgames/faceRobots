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
    for(var i = 0; i < sokID; i+= 1){
      io.emit('addRival', {s: players[i]});
    }
    players[socket.id] = sokID;
    sokID += 1;
  });

});

http.listen(port, function(){
  console.log('listening on *:' + port);
});
