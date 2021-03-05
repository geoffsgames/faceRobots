var socket = io();

var uniqueID = Math.random();
socket.emit('newPlayer', {uID:uniqueID, gr:getStringArray(player.grid)});
player.updateRivals();

var rivalGrids = []; //the ID codes
var curRival = null;
var selectedRival = null;

function getStringArray(inArr){
	var outArr = []
	for(var x = 0; x < inArr.length; x += 1){
		outArr[x] = []
		for(var y = 0; y < inArr.length; y += 1){
			if(inArr[x][y] != undefined && inArr[x][y] != null)
				outArr[x][y] = inArr[x][y].type;
		}
	}
	return(outArr);
}

socket.on('rivalChanged', function(msg){
	if(msg.uID != uniqueID){
		msg.gr = convertGridToImage(msg.gr);
		rivalGrids['' + msg.uID] = msg.gr
		msg.gr.opacity = 0.5;
		msg.gr.setScaleX(0.7);
		msg.gr.setScaleY(0.7);
		msg.gr.left = (window.pageXOffset || document.documentElement.scrollLeft) + (document.documentElement.clientWidth - 50);
		msg.gr.top = (window.pageYOffset || document.documentElement.scrollTop) + 50;
		if(selectedRival == undefined || msg.uID == selectedRival){
			if(curRival != null)
				canvas.remove(curRival)
			curRival = msg.gr
			canvas.add(curRival);
			selectedRival = msg.uID;
		}
	}
});

socket.on('newRival', function(msg){
	if(msg.uID != uniqueID){
		if(curRival != null)
			canvas.remove(curRival)
		msg.gr = convertGridToImage(msg.gr);
		rivalGrids['' + msg.uID] = msg.gr;
		selectedRival = msg.uID;
		msg.gr.opacity = 0.5;
		msg.gr.setScaleX(0.7);
		msg.gr.setScaleY(0.7);
		msg.gr.left = (window.pageXOffset || document.documentElement.scrollLeft) + (document.documentElement.clientWidth - 50);
		msg.gr.top = (window.pageYOffset || document.documentElement.scrollTop) + 50;
		curRival = msg.gr
		canvas.add(curRival)
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
