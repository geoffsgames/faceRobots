//switch off when editing locally
var usingSocket = true;

var socket = io();

var uniqueID = Math.random();

if(usingSocket){
	alert("Right. We're emitting new fucking player. HOW HARD IS THIS FOR YOU TO FUCKING UNDERSTAND?!?!?!?!?!");
	socket.emit('newPlayer', {uID:uniqueID, gr:getStringArray(player.grid)});
	alert("FUCKING EMITTED NEW PLAYER!!!!!!!!!!!!!!!!!!!");

}
player.updateRivals();

var rivalGrids = []; //the ID codes
var curRival = null;
var selectedRival = null;
var rivalIconMargin = 20;

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
		msg.gr = convertGridToRivalIcon(msg.gr);
		rivalGrids['' + msg.uID] = msg.gr
		if(selectedRival == undefined || msg.uID == selectedRival){
			if(curRival != null)
				canvas.remove(curRival)
			canvas.add( msg.gr);
			curRival = canvas._objects.pop(); //you'd think curRival = msg.gr would work but there you go
			curRival.setCoords();
			selectedRival = msg.uID;
		}
	}
});

socket.on('newRival', function(msg){
	alert("Right. We have a new fucking rival. JUST HOW FUCKING COMPLEX IS THIS FOR YOU - THIS IS LITERALLY EXACTLY THE SAME AS YOU WERE DOING BEFORE!!!!!!");
	if(msg.uID != uniqueID){
		if(curRival != null)
			canvas.remove(curRival)
		msg.gr = convertGridToRivalIcon(msg.gr);
		rivalGrids['' + msg.uID] = msg.gr;
		selectedRival = msg.uID;
		canvas.add(msg.gr);
		curRival = canvas._objects.pop(); //you'd think curRival = msg.gr would work but there you go
		curRival.setCoords();
		//so new rival/player knows about me in return
		socket.emit('newPlayer', {uID:uniqueID, gr:getStringArray(player.grid)});
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

function convertGridToRivalIcon(grid){
	var rob = new Player(0,0,0);
	rob.isRivalIcon = true;
	for(var x = 0; x < grid.length; x+= 1){
		for(var y = 0; y < grid.length; y += 1){
			if(grid[x][y] != undefined && grid[x][y] != null)
				rob.addPiece(x,y,grid[x][y]);
		}
	}
	if(rob.heart != undefined)
		rob.heart.image.bringToFront();
	var robImg = rob.group;

	robImg.opacity = 0.5;
	robImg.setScaleX(0.7);
	robImg.setScaleY(0.7);
	robImg.left = (window.pageXOffset || document.documentElement.scrollLeft) + (document.documentElement.clientWidth - robImg.width - rivalIconMargin);
	robImg.top = (window.pageYOffset || document.documentElement.scrollTop) + rivalIconMargin;
	robImg.selectable = true;

	return(robImg);
}
