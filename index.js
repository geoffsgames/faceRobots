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
    io.emit('newRival', msg)
  });
  
  socket.on('playerShapeChanged', function(msg){
    io.emit('rivalChanged', msg);
  });
  
  socket.on('jumpToRival_request', function(msg){
	  io.emit("jumpToRival_response", msg)
  });
  
  socket.on('jumpToPVPAccepted', function(msg){
	  io.emit("jumpToPVP", msg)
  })
	
  socket.on('reportRivalArrived', function(msg){
	  io.emit("rivalHasArrived", msg)
  })
	
  socket.on('allComplete_rival', function(msg){
	  io.emit("allComplete_rival2", msg)
  })

  ////keydown events
  socket.on('rivalKeyCode', function(msg){
	  io.emit("rivalKeyCode2", msg)
  })
	 
  socket.on('returnedKeyCode', function(msg){
	  io.emit("returnedKeyCode2", msg)
  })

  ////keyup events
  socket.on('rivalKeyCodeUp', function(msg){
	  io.emit("rivalKeyCodeUp2", msg)
  })
	 
  socket.on('returnedKeyCodeUp', function(msg){
	  io.emit("returnedKeyCodeUp2", msg)
  })
	
  socket.on('rivalAddDelBlock', function(msg){
	  io.emit('rivalAddDelBlock2', msg)
  })
});

http.listen(port, function(){
  console.log('listening on *:' + port);
});


/**
///////////////////////////////PEER TO PEER////////////////////////////////////////////////////
var io2 = require('socket.io')(http);
var p2p = require('socket.io-p2p-server').Server;
io2.use(p2p);
server.listen(3030);

io2.on('connection', function(socket){
  socket.on('peer-msg', function (data) {
    console.log('Message from peer: %s', data)
    socket.broadcast.emit('peer-msg', data)
  })

  socket.on('go-private', function (data) {
    socket.broadcast.emit('go-private', data)
  })

});

*/
