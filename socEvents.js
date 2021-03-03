var socket = io();

var uniqueID = Math.random();
socket.emit('newPlayer', uniqueID);
player.updateRivals();

var rivalGrids = []; //the ID codes
var curRival = null;
var selectedRival = null;

socket.on('rivalChanged', function(msg){
	if(msg.uID != uniqueID)
		rivalGrids['' + msg.uID] = msg.gr
	
	if(selectedRival == undefined || msg.uID == selectedRival){
		if(curRival != null)
			canvas.remove(curRival)
		canvas.add(msg.gr);
		curRival = msg.gr
		msg.gr.opacity = 0.2;
		msg.gr.width = msg.gr.width / 2;
		msg.gr.height = msg.gr.height / 2;
		msg.gr.left = 100;
		msg.gr.top = 100;
		selectedRival = msg.uID;
	}

});

socket.on('newRival', function(msg){
	if(msg.m != uniqueID)
		rivalGrids['' + msg.m] = null;
});


socket.on('acceptJumpToPVP', function(msg){
	if(uniqueID == msg.otherID){//another moving to me
		socket.emit("jumpToPVPAccepted", {targID:uniqueID, visID:msg.myID, pX:player.myX, pY:player.myY,l:land});
	}
})

socket.on('jumpToPVP', function(msg){
	if(uniqueID == msg.myID){ //I'm the one moving
		//change landscape
		moveToRival(msg);
	}
})
