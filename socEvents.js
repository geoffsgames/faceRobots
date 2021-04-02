"use strict";
var rivalGrids = []; //the ID codes
var rivalGridIDs = []; //codes used as indexes in rivalGrids
var curRival = null;
var curRivalID = null;
var curRivalIDind = 0;
var rivalIconMargin = 20;
var rivalID = null; //when we're actually fighting
var socket = io();
var uniqueID = "" + Math.random();
var name = prompt("Enter your name: ");

var rivalArrivedMsg = null;
var rivalArrivedMsgUp = null;

var jumpToPVPmsg = null;
var acceptPVPmsg = null;

var sharedSeed = NaN; //ensures both machines use same seeded random numbers for random events

socket.emit('newPlayer', {uID:uniqueID, gr:getStringArray(player.grid), trueNewPlayer:true, name});


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




////////////////////////////////////////////////////CHANGING THE GRIDS/ICONS IN THE CORNER ////////////////////////////

//one of the other robots on the network changed it's grid layout (e.g. lost a piece, added a piece)
socket.on('rivalChanged', function(msg){
		if(msg.uID != uniqueID){
			var img = convertGridToRivalIcon(msg.gr);
			img.add(new fabric.Text(msg.name,{fontSize: 20}));
			img.grid = msg.gr;
			rivalGrids[msg.uID] = img
			if("" + msg.uID == curRivalID){ //if currently viewing this rival then update the image shown
				if(curRival != null)
					canvas.remove(curRival);
				curRival = img;
				canvas.add(curRival);
				curRival.setCoords();
			}
		}
});

//new player joined network
socket.on('newRival', function(msg){
		if(msg.uID != uniqueID && rivalGridIDs.indexOf(msg.uID) == -1){
			var rivImg = convertGridToRivalIcon(msg.gr);
			updateRivalShown(rivImg, msg.uID, msg.gr);
			rivImg.add(new fabric.Text(msg.name,{fontSize: 20}));
			if(msg.trueNewPlayer) //if player is completely new (i.e. it's not me that's just joined and I've just learned of the existing players)
				socket.emit('newPlayer', {uID:uniqueID, gr:getStringArray(player.grid), trueNewPlayer:false, name}); //so new rival/player knows about me in return

			curRivalIDind = rivalGridIDs.length;
			rivalGridIDs.push(msg.uID);
		}
});

//so that only adjust rivals in corner of grid at right time in each update




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

///////////////////////////////////////////////////MOVING TO RIVAL'S ARENA FOR PVP////////////////




//*****Step 1 = ATTACKER CLICKS ON RIVAL AND SENDS REQUEST 

//(attacker) after request to try moving to rival (see Display.js) alert server
function jumpToRival(){
	socket.emit("jumpToRival_request", {gr:getStringArray(player.grid),myID:uniqueID,otherID:curRivalID,name });
}

//(receiver) response to attacker's request 
socket.on('jumpToRival_response', function(msg){
	if(msg.otherID == uniqueID){
		if(confirm('Accept challenge from ' + msg.name) + '?'){ //prompt the user
			enteringRival = true; //stops anything else happening while I'm accepting the rival
			player.movX = 0;
			player.movY = 0;
			player.willMovX = 0;
			player.willMovY = 0;
			socket.emit("jumpToPVPAccepted", {targID:uniqueID, visID:msg.myID, pX:player.myX, pY:player.myY, facing:player.facing,  //send all details of me and my landscape so rival can join it
								seed:land.seed,globalSeed:globalSeed, startSeed:startSeed, startGlobalSeed:startGlobalSeed});
			acceptPVPmsg = msg;
		}
	}
})

//******Step 2 = Request accepted. Attacker animates over to rival's land

//(attacker)
socket.on('jumpToPVP', function(msg){
	if(uniqueID == msg.visID){ //I AM the one moving
		jumpToPVPmsg = msg;
	}
})		

//implementation of PVP entry stuff synced with main game loop
function checkPVP(){
	return (jumpToPVPimpl() || acceptPVPimpl())
}

//socket.on('jumpToPVP' implementation in sync with main game loop
function jumpToPVPimpl(){
	if(jumpToPVPmsg == null)
		return false;
	
		
	player.movX = 0;
	player.movY = 0;
	enemy.movY = 0;
	enemy.movY = 0;
	
	var msg = jumpToPVPmsg;
	jumpToPVPmsg = null;
	enteringRival = true; //stops anything else happening while I'm animating across
	rivalID = msg.targID;
	if(enemy != null)
		canvas.remove(enemy.group)
	moveToRival(msg); //move to new landscape
	return true;
}

//socket.on('jumpToRival_response' implementation in sync with main game loop
function acceptPVPimpl(){
	if(acceptPVPmsg == null)
		return false;
	
		
	player.movX = 0;
	player.movY = 0;
	enemy.movY = 0;
	enemy.movY = 0;
	
	var msg = acceptPVPmsg;
	acceptPVPmsg = null;
	if(enemy != null){
		enemy.updateGrid(true); //clear old enemy;
		canvas.remove(enemy.group);
	}
	canvas.remove(player.group)
	rivalID = msg.myID;
	return true;
}

//(receiver) add attacker when position attacker ends up in has been calculated
socket.on('rivalHasArrived', function(msg){
	if(msg.yourID == uniqueID){
		sharedSeed = msg.seed;
		animateRivalArriving(msg);
	}
});

//(attacker) move into the rival's arena - part1: initialise animating into corner to show about to move
function moveToRival(msg){
	player.animateToRival(msg);
}

//(attacker) move into rival's arena - part2: after animating into corner create landscape of rival
function moveToRival2(msg){
	clearLandscape();//get rid of enemy and collectables
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
	addRival(curRival.grid, msg.pX, msg.pY, msg.facing);
	
	scrollToEnemy();
	
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
	while(player.extractFromOverlap(20)){
		if(Math.random() > 0.5){ //if extracting from wall doesn't work then try a few more times, moving to the left and down as likely to be in top right corner 
											//(but may not be - depending on scroll - but can't be in bottom or left corner)
			player.myX -= 10;
		}
		if(Math.random() > 0.5)
			player.myY -= 10;
	}
	
	sharedSeed = Math.random() * 1000;
	socket.emit('reportRivalArrived', {yourID:rivalID, grid:getStringArray(player.grid), rivalX:player.myX, rivalY:player.myY, facing:player.facing, seed:sharedSeed});
	scrollToPlayer();
	//initialise animating out of corner
	player.animateOutOfCorner(moveToRival3);
	
	//the host (not invader) always moves first - this is to ensure consistency between remote machines
	player.isInvader = true;
	enemy.isInvader = false;
}



//(attacker and receiver) move into rival's arena - step3: prepare to actually start playing out of animating out of the corner of my new landscape
function moveToRival3(){
	player.group.originX = "left";
	player.group.originY = "top";
	canvas.remove(player.group);
	
	player.restart();
	canvas.requestRenderAll();
	
	completeCounter = 0;
	inPVP = true;
	enteringRival = false;
	rivalTimeCounter = 0; //counter ensures I'm at the same game time as rival (increments on every game update)
	enemy.readyToMove = true; //non human players fade in. Human plays don't so ready to move from start
	
	//random numbers need to be seeded with shared (randomly generated seperate to seed which keeps landscape consistant) seed 
	//so random events are identical in both machines
	Math.seed = sharedSeed;
	randsSeeded = true; 
	reversePoint = 0; //this ensures when weapons which point (e.g. knives) are added both robots choose the same direction for them to point in
	player.recreateGroup(0,0);
	updateGame();
}

//(receiver) create rival in my arena
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
	rival.setupWeapons();
	rival.heart.image.bringToFront();
	rival.changedDir = false;
	enemy = rival;
}

//(receiver) attacker spins into my land (as also happens on their screen)
function animateRivalArriving(msg){
	addRival(msg.grid, msg.rivalX, msg.rivalY, msg.facing);
	
	//the host (not invader) always moves first - this is to ensure consistency between remote machines
	enemy.isInvader = true;
	player.isInvader = false;
	
	enemy.group.left = curRival.left;
	enemy.group.top = curRival.top;
	enemy.group.opacity = 0.8;
	enemy.group.scaleX = 0.7;
	enemy.group.scaleY = 0.7;
	enemy.animateOutOfCorner(moveToRival3);
}

///////////////////////////////////////////////////SYNCING RIVALS////////////////

socket.on("rivalKeyCode2", function(msg){
	if(msg.rID == uniqueID){
		//console.log("Returning " + msg + " TIME " + counter4KeyCmds);
		//console.log(msg);
		msg.time = counter4KeyCmds; //if HIS term when HE will do it is ahead of mine, then I will wait. I MY term when I will do it is ahead of his, then he will wait
		msg.rID = rivalID;
		returnKeyCode(msg);
		keyMessage = msg;
	}
});

function returnKeyCode(msg){
	socket.emit("returnedKeyCode", msg);

}

socket.on("returnedKeyCode2", function(msg){
	if(msg.rID == uniqueID){
		//console.log("Returned " + msg + " TIME " + counter4KeyCmds);
		//console.log(msg);
		returnedKeyMessage = msg;
		if(waitReturnedKeyMessage)
			updateGame();
	}
});


////////for lifting finger off key
socket.on("rivalKeyCodeUp2", function(msg){
	if(msg.rID == uniqueID){
		msg.time = counter4KeyCmds; //if HIS term when HE will do it is ahead of mine, then I will wait. I MY term when I will do it is ahead of his, then he will wait
		msg.rID = rivalID;
		returnKeyCodeUp(msg);
		keyMessageUp = msg;
	}
});

function returnKeyCodeUp(msg){
	socket.emit("returnedKeyCodeUp", msg);

}

socket.on("returnedKeyCodeUp2", function(msg){
	if(msg.rID == uniqueID){
		returnedKeyMessageUp = msg;
		if(waitReturnedKeyMessageUp)
			updateGame();
	}
});
//////

//https://stackoverflow.com/questions/27012854/change-iso-date-string-to-date-object-javascript
function parseISOString(s) {
  var b = s.split(/\D+/);
  return new Date(Date.UTC(b[0], --b[1], b[2], b[3], b[4], b[5], b[6]));
}

socket.on('allComplete_rival2', function(msg){
	if(msg.uID == rivalID){

		//console.log("other guy complete");
		rivalCompleted = true;
		if(waitingForRival) //if I've also completed
			allComplete2();
		else
			oldTime = parseISOString(msg.time); //sync finishing times - slower one always uses time of faster
	}
});



//////////////////////////////////////KEY INPUT FROM RIVAL ///////////////////////////////////////////////

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
    else if(code == "clockwise"){
    	//shift
    	if(enemy.willFinishRotating == -1)
    		enemy.willRotate = 1;//clockwise
    }
    else if(code == 32){ //space
    	if(enemy.movX != 0 || enemy.movY != 0)
    		enemy.willStop = true;
    }
    else if(code >= 49 && code <= 58){ //numbers
		  enemy.stoppedPressingMotor = false;
    	enemy.motorWillStart = code - 49;
    }

}

function changeStateEnemyUp(code){
	if(code >= 49 && code <= 58) //motors
		enemy.stoppedPressingMotor = true;

	if(code == 13 || code == 16)//finish rotation
		enemy.finishRotating();
}



//////////////////////////////////////ADDING / DELETING BLOCKS ///////////////////////////////////////////////

socket.on('rivalAddDelBlock2', function(msg){
	if(msg.rID == uniqueID){
		rivalAddDelBlocks.push(msg);
	}
});



//add/delete rival block in sync with main game loop
function addDelRivalBlocksImpl(){
	rivalAddDelBlocks.reverse(); //to ensure additions/deletions happen in same order as original
	while(rivalAddDelBlocks.length > 0){
		block = rivalAddDelBlocks.pop();
		var oldSelected = selectedBlock;
		if(block.delete)
			enemy.deleteBlock(gameGrid[block.myX][block.myY].image,!block.rotate,true, block.invSelected);
		else
			enemy.addBlockInEdit(block.myX, block.myY, block.type);
		selectedBlock = oldSelected; //(TODO a bit hacky) some code in these functions changes selectedBlock (the block currently selected) as it's written for the player. 
							//Shouldn't do so for rival so stop it interfering in case I'm editing player at same time.
		
	}
	
}



