var socket = io();

var uniqueID = Math.random();
socket.emit('newPlayer', {uID:uniqueID, gr:player.grid});
player.updateRivals();

var rivalGrids = []; //the ID codes
var curRival = null;
var selectedRival = null;

socket.on('rivalChanged', function(msg){
	if(msg.uID != uniqueID){
		msg.gr = convertGridToImage(msg.gr);
		rivalGrids['' + msg.uID] = msg.gr
		msg.gr.opacity = 0.2;
		msg.gr.width = msg.gr.width / 2;
		msg.gr.height = msg.gr.height / 2;
		msg.gr.left = 100;
		msg.gr.top = 100;
		if(selectedRival == undefined || msg.uID == selectedRival){
			if(curRival != null)
				canvas.remove(curRival)
			canvas.add(msg.gr);
			curRival = msg.gr
			selectedRival = msg.uID;
		}
	}
});

socket.on('newRival', function(msg){
	alert("HOW MANY DO YOU FUCKING WANT??!? SHALL I ADD ANOTHER 5?!?!?");
	alert("IT'S LITERALLY RIGHT FUCKING HERE WHAT THE FLYING FUCK IS WRONG WITH YOU");
	alert(msg);
	if(msg.uID != uniqueID){
		msg.gr = convertGridToImage(msg.gr);
		rivalGrids['' + msg.uID] = msg.gr;
		curRival = msg.gr
		selectedRival = msg.uID;
		msg.gr.opacity = 0.2;
		msg.gr.width = msg.gr.width / 2;
		msg.gr.height = msg.gr.height / 2;
		msg.gr.left = 100;
		msg.gr.top = 100;
		if(curRival != null)
			canvas.remove(curRival)
		canvas.add(msg.gr)
	}
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
