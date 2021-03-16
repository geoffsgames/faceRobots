
var rivalGrids = []; //the ID codes
var rivalGridIDs = []; //codes used as indexes in rivalGrids
var curRival = null;
var curRivalID = null;
var curRivalIDind = 0;
var rivalIconMargin = 20;

//switch off when editing locally
var usingSocket = true;

var rivalID = null; //when we're actually fighting

var socket = io();

var uniqueID = "" + Math.random();

var rivalArrivedMsg = null;

if(usingSocket){
	socket.emit('newPlayer', {uID:uniqueID, gr:getStringArray(player.grid), trueNewPlayer:true});
}

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
	savedRivalChanged.push(msg);
});



socket.on('newRival', function(msg){
	savedNewRival.push(msg);

});

socket.on('rivalHasArrived', function(msg){
	if(msg.yourID == uniqueID)
		rivalArrivedMsg = msg;
});


function checkSocketMessages(){
	newRivalImpl();
	rivalChangedImpl();
	jumpToPVPImpl();
	acceptJumpToPVPImpl();
	if(rivalArrivedMsg != undefined && rivalArrivedMsg != null){
		animateRivalArriving(rivalArrivedMsg);
		rivalArrivedMsg = null;
	}
}

//actions in response to receiving socket.io message

function newRivalImpl(){
	while(savedNewRival.length > 0){
		var msg = savedNewRival.pop();
		if(msg.uID != uniqueID && rivalGridIDs.indexOf(msg.uID) == -1){
			var rivImg = convertGridToRivalIcon(msg.gr);
			updateRivalShown(rivImg, msg.uID, msg.gr);
			if(msg.trueNewPlayer) //if player is completely new (i.e. it's not me that's just joined and I've just learned of the existing players)
				socket.emit('newPlayer', {uID:uniqueID, gr:getStringArray(player.grid), trueNewPlayer:false}); //so new rival/player knows about me in return

			curRivalIDind = rivalGridIDs.length;
			rivalGridIDs.push(msg.uID);
		}
	}
	
}

function rivalChangedImpl(){
	while(savedRivalChanged.length > 0){
		var msg = savedRivalChanged.pop();
		if(msg.uID != uniqueID){
			var img = convertGridToRivalIcon(msg.gr);
			rivalGrids[msg.uID] = curRivalID
			if("" + msg.uID == curRivalID){ //if currently viewing this rival then update the image shown
				if(curRival != null)
					canvas.remove(curRival);
				curRival.grid = msg.gr;
				curRival = img;
				canvas.add(curRival);
				curRival.setCoords();
			}
		}
	}
}

function jumpToPVPImpl(){
	while(savedPVP.length > 0){
		var msg = savedPVP.pop();
		if(uniqueID == msg.visID){ //I'm the one moving
			//change landscape
			moveToRival(msg);
		}
	}
}

function acceptJumpToPVPImpl(){
	while(savedAcceptPVP.length > 0){
		var msg = savedAcceptPVP.pop();
		if(uniqueID == msg.otherID){//another moving to me
			socket.emit("jumpToPVPAccepted", {targID:uniqueID, visID:msg.myID, pX:player.myX, pY:player.myY,
							  seed:land.seed,globalSeed:globalSeed, startSeed:startSeed, startGlobalSeed:startGlobalSeed});
			updateRivalShown(rivalGrids[msg.myID], msg.myID, rivalGrids[msg.myID].grid);
			leftArrow.visible = false;
			rightArrow.visible = false;
			rivalGrids[msg.myID].opacity = 1.0;
			rivalID = msg.myID;
			timeJumpToRival = new Date;
		}
	}
}



function animateRivalArriving(msg){
	timeJumpToRival = NaN
	enteringRival = true;
	canvas.remove(enemy.group)
	completeNum = 0;
	addRival(msg.grid, msg.rivalX, msg.rivalY);
	canvas.add(enemy.group); //enemy = rival just arriving
	enemy.group.left = curRival.left;
	enemy.group.top = curRival.top;
	enemy.group.opacity = 0.8;
	enemy.group.scaleX = 0.7;
	enemy.group.scaleY = 0.7;
	enemy.animateOutOfCorner(moveToRival3);
}

function updateRivalShown(img, id, grid){
	if(curRival != null)
		canvas.remove(curRival)
	rivalGrids[id] = img;
	curRivalID = id;
	curRival = img;
	curRival.grid = grid;
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
	savedAcceptPVP.push(msg)
})

socket.on('jumpToPVP', function(msg){
	savedPVP.push(msg)
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
	canvas.remove(robImg)
	return(robImg);
}

//actually move into the rival's arena - step1: initialise animating into corner to show about to move
function moveToRival(msg){
	enteringRival = true;
	player.animateToRival(msg);
	rivalID = curRivalID;
}

//move into rival's arena - step2: after animating into corner create landscape of rival
function moveToRival2(msg){
	clearLandscape();//get rid of enemy and collectables
	canvas.clear();
	land = null;
	allLandscapes = [];
	//save and load new "allLandscapes" because other rival's land occupies different universe/different complete set of landscapes
	//universe determined by globalSeed while currentSeed determines this landscape so both now also change
	
	//will be used to create landscape in start()
	globalSeed = msg.globalSeed
	curSeed = msg.seed;
	startSeed = msg.startSeed;
	startGlobalSeed = msg.startGlobalSeed;
	clearOldNeighbours(null);
	start();
	willAddEnemy = false;
	addRival(curRival.grid, msg.pX, msg.pY);
	
	player.myX = Math.round((curRival.left + scrollLeft) / gridWidth);
	player.myY = Math.round((curRival.top + scrollTop) / gridHeight);
	
	player.group.left = curRival.left;
	player.group.top = curRival.top;
	player.group.opacity = 0.8;
	player.group.scaleX = 0.7;
	player.group.scaleY = 0.7;
	canvas.add(player.group);
	canvas.remove(curRival);
	
	//get out of wall
	while(player.extractFromOverlap()){
		if(Math.random() > 0.5){ //if extracting from wall doesn't work then try a few more times, moving to the left and down as likely to be in top right corner 
											//(but may not be - depending on scroll - but can't be in bottom or left corner)
			player.myX -= 10;
		}
		if(Math.random() > 0.5)
			player.myY -= 10;
	}
	socket.emit('reportRivalArrived', {yourID:rivalID, grid:getStringArray(player.grid), rivalX:player.myX, rivalY:player.myY});
	scrollToPlayer();
	//initialise animating out of corner
	player.animateOutOfCorner(moveToRival3);
}

function addRival(grid, rivalX, rivalY, rivalFacing){
	var rival = new Player(rivalX, rivalY, rivalFacing);
	for(var x =0 ; x < grid.length; x++){
		for(var y = 0; y < grid.length; y++){
			if(grid[x][y] != undefined){
				rival.totalNumBlocks ++;
				rival.addPiece(x,y,grid[x][y]);
			}
		}
	}
	rival.heart.image.bringToFront();
	rival.changedDir = false;
	enemy = rival;
}

//move into rival's arena - step3: prepare to actually start playing out of animating out of the corner of my new landscape
function moveToRival3(){
	player.group.originX = "left";
	player.group.originY = "top";
	player.restart();
	canvas.requestRenderAll();
	completeCounter = 0;
	enteringRival = false;
	updateGame();
}

function sendKeyPress(key,doubleclick){
    if(enemy.isEnemy) //not playing PVP
        return;
    socket.emit('key-press', {key:key, dc:doubleclick, rID:uniqueID})
}
  
socket.on('receiveKey-press', function (msg) {
     if(msg.rID != rivalID)
	return;
     changeStateEnemy(msg.key,msg.dc);
})


//see changeState(...) in display
function changeStateEnemy(code,doubleclick){
	code = enemy.convertCode(code);
    if(code== "left"){
        //keyCode 37 is left arrow
        enemy.willSetMovement(-1,0,doubleclick);
    }
    else if(code== "right"){
        //keyCode 39 is right arrow
        enemy.willSetMovement(1,0,doubleclick);
    }
    else if(code== "up"){
        //keyCode 38 is up arrow
    	enemy.willSetMovement(0,-1,doubleclick);
    }
    else if(code== "down"){
        //keyCode 40 is down arrow
    	enemy.willSetMovement(0,1,doubleclick);
    }
    else if(code == "anticlockwise"){
    	//shift
    	if(enemy.willFinishRotating == -1)
    		enemy.willRotate = -1;//anti-clockwise
    }
    else if(code == 32){ //space
    	if(enemy.movX != 0 || enemy.movY != 0)
    		enemy.willStop = true;
    }
    else if(code >= 49 && code <= 58){ //numbers
		  stoppedPressingMotor = false;
    	enemy.motorWillStart = code - 49;
    }
    else if(code==13){
    	//enter
    	if(enemy.willFinishRotating == -1)
    		enemy.willRotate =1;//clockwise
    }
}
