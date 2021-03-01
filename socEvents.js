var socket = io();
socket.on('addRival', function(){
	rival = new Player(5,5,2);
	addStandardPlayerPieces(rival)
	
});
