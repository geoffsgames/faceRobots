var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var port = process.env.PORT || 3000;

app.use(express.static(__dirname));

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

http.listen(port, function(){
  console.log('listening on *:' + port);
});

io.on('connection', function(socket){
  // When a player connects
  alert('please die in pain');

  // When a player moves
// When a player moves
  socket.on('move-player', function(msg) {
    alert(msg);
  })
})
