//switch off when editing locally
var usingSocket = true;

var socket = io();

var uniqueID = "" + Math.random();

if(usingSocket){
	socket.emit('newPlayer', {uID:uniqueID, gr:getStringArray(player.grid)});
}

var rivalGrids = []; //the ID codes
var rivalGridIDs = []; //codes used as indexes in rivalGrids
var curRival = null;
var curRivalID = null;
var curRivalIDind = 0;
var rivalIconMargin = 20;

//add arrows for scrolling through rivals""
var scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
var scrollTop = window.pageYOffset || document.documentElement.scrollTop;

var leftArrow = new fabric.Image(document.getElementById("arrow"), {
	left: scrollLeft + (document.documentElement.clientWidth - 100 - rivalIconMargin),
	top: scrollTop + rivalIconMargin + 100,
	lockScalingX: false,
	lockScalingY: false,
	lockMovementX: false,
	lockMovementY: false,
	hasControls: false,
	offsetX: "left",
	offsetY: "top",
	borderColor: 'yellow',
	strokeWidth: 5
});

//add arrows for scrolling through rivals
var rightArrow = new fabric.Image(document.getElementById("arrow"), {
	left: scrollLeft + (document.documentElement.clientWidth - 30 - rivalIconMargin),
	top: scrollTop + rivalIconMargin + 100,
	lockScalingX: false,
	lockScalingY: false,
	lockMovementX: false,
	lockMovementY: false,
	hasControls: false,
	offsetX: "left",
	offsetY: "top",
	borderColor: 'yellow',
	strokeWidth: 5,
	angle: 180
});

canvas.add(leftArrow);
canvas.add(rightArrow);
leftArrow.visible = false;
rightArrow.visible = false;


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
	savedRivalChanged.add(msg);
});



socket.on('newRival', function(msg){
	savedNewRival.add(msg);

});

function newRivalImpl(){
	var msg = savedNewRival.pop();
	while(msg != undefined){
		if(msg.uID != uniqueID && rivalGridIDs.indexOf(msg.uID) == -1){
			msg.gr = convertGridToRivalIcon(msg.gr);
			updateRivalShown(msg.gr, msg.uID);
			//so new rival/player knows about me in return
			socket.emit('playerShapeChanged', {uID:uniqueID, gr:getStringArray(player.grid)});
			curRivalIDind = rivalGridIDs.length;
			rivalGridIDs.push(msg.uID);
		}
	}
	
}
	
function rivalChangedImpl(){
	var msg = savedRivalChanged.pop();
	while(msg != undefined){
		if(msg.uID != uniqueID){
			var img = convertGridToRivalIcon(msg.gr);
			rivalGrids[msg.uID] = curRivalID
			if("" + msg.uID == curRivalID){ //if currently viewing this rival then update the image shown
				if(curRival != null)
					canvas.remove(curRival)
				curRival = img
				canvas.add(curRival);
				curRival.setCoords();
			}
		}
	}
}

function updateRivalShown(img, id){
	if(curRival != null)
		canvas.remove(curRival)
	rivalGrids[id] = img;
	curRivalID = id;
	curRival = img;
	canvas.add(curRival);
	curRival.setCoords();

	updateLeftRightArrows();

}

function updateLeftRightArrows(){
	rightArrow.visible = curRivalIDind < rivalGridIDs.length;
	leftArrow.visible = curRivalIDind > 0;

	leftArrow.left =  scrollLeft + (document.documentElement.clientWidth - curRival.width - rivalIconMargin);
	leftArrow.top = rivalIconMargin + curRival.height;
	rightArrow.left = scrollLeft + (document.documentElement.clientWidth - 30 - rivalIconMargin);
	rightArrow.top = scrollTop + rivalIconMargin + curRival.height;
}


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

	robImg.opacity = 0.8;
	robImg.scaleX = 0.7;
	robImg.scaleY = 0.7;
	robImg.hasControls = false;
	robImg.borderColor = 'red';
	robImg.strokeWidth = 5;
	robImg.left = (window.pageXOffset || document.documentElement.scrollLeft) + (document.documentElement.clientWidth - robImg.width - rivalIconMargin);
	robImg.top = (window.pageYOffset || document.documentElement.scrollTop) + rivalIconMargin;
	robImg.selectable = true;

	return(robImg);
}
