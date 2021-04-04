"use strict";
document.body.style.overflow = 'hidden'; //prevent scrolling

var canvasBG = document.getElementById('canvasBG');
var context = canvasBG.getContext('2d');

var usingSocket = false;

var canvas = new fabric.Canvas("canvas");

//editing settings
canvas.controlsAboveOverlay = true;

var character;

//character speed
var initialInterval = 256;
var minInt = 16;
var maxSpeed = initialInterval / minInt;
var numSpeeds = (Math.log(maxSpeed) / Math.log(2));

var selectedBlock = null;

var interval = initialInterval;
var oldInterval = interval;

var lastTime = 0;
var lastKey = 0;

var clientWidth = document.documentElement.clientWidth;
var clientHeight = document.documentElement.clientHeight;

var displayWidth, displayHeight; //size of the whole current landscape 
var maxScrollX, maxScrollY;

//number of squares across/down can be displayed on screen at once
var gridWidth = clientWidth / 40;
if(Math.abs(gridWidth - 16) < Math.abs(gridWidth - 32))
	gridWidth = 16;
else
	gridWidth = 32;
var gridHeight = gridWidth;

document.getElementById("diffSliderDiv").style.setProperty("left", (document.documentElement.clientWidth / 2) + "px");
var slider = document.getElementById("difficultySlider");

document.getElementById("commandsBtnDiv").style.setProperty("left", (document.documentElement.clientWidth * 0.75) + "px");
var cmdButton = document.getElementById("commandsBtn");
var cmdWindow = document.getElementById("commandsWindow");
var switchBtn = document.getElementById("switchBtn");
var cmdText = document.getElementById("commandsText");

//number of pieces actually shown on screen
//var numPiecesScreenX = Math.ceil(clientWidth / gridWidth);
//var numPiecesScreenY = Math.ceil(clientHeight / gridHeight);
//Changed to "typical" number because different numbers for different screens messes up multiplayer
var numPiecesScreenX = 43;
var numPiecesScreenY = 21;    


var code;
var invBackground;
var scrollSpeedup = 2;

var canEditRotations = true;
var dt = new Date();
var scrollDelay = 16;

var waitingForRotate = false; //before non intermediate has been confirmed, don't do anything once non intermediate confirmed
var reallyWaitingForRotate = false; //after non intermediate has been confirmed, do nothing

var startTime = 0;

var willLag = false;
var savedKeyPress = {key:null, dc:0};
var messageSent = false;
var savedKeyPressUp = {key:null, dc:0};
var messageSentUp = false;
var setupGrass = false;

var oldKeyCodes = {up:38, left:37, right:39, down:40, clockwise:16, anticlockwise:13, downstairs:68}
var newKeyCodes = {up:87, right:68, down:83, left:65, clockwise:39, anticlockwise:37, downstairs:13}
var selectedKeyCodes = newKeyCodes;
var newKeyHTML = "<p>ROTATE: left and right arrows</p><p>MOVE UP: \"w\"</p><p>MOVE LEFT: \"a\"</p><p>MOVE RIGHT: \"d\"</p><p>MOVE DOWN: \"s\"</p>"
	+"<p>STOP/EDIT: space</p><p>SWITCH MOTOR/SPRING: up and down arrows</p><p>GO DOWN PORTAL: enter</p><p>FIRE SPRING/MOTOR: shift</p>";
var oldKeyHTML = "<p>ROTATE: shift and enter</p><p>MOVEMENT: arrow keys</p><p>STOP/EDIT: space</p><p>GO DOWN PORTAL: \"d\"</p><p>FIRE SPRING/MOTOR: number key corresponding to motor</p>";
switchBtn.innerHTML = "Change to Classic"

cmdText.innerHTML = newKeyHTML;

function initGrass(){
	var canvasGrass = document.getElementById('canvasGrass');
	//TODO - hard coded from landscape max size
	var canvWidth = gridWidth * 70;
	var canvHeight = gridHeight * 70;

	
	canvasGrass.width  = canvWidth; // in pixels
	canvasGrass.height = canvHeight;
	canvasGrass.style.left = "-" + canvas._offset.left + "px";
	canvasGrass.style.top = "-" + canvas._offset.top + "px";

	
	var context = canvasGrass.getContext('2d');
	var img=document.getElementById("grass");
	var imgWidth =img.width;
	var imgHeight = img.height;
	
	for(var w =0; w < Math.ceil(canvWidth / imgWidth); w++){
		for(var h =0; h < Math.ceil(canvHeight / imgHeight); h++){
			context.drawImage(img,imgWidth * w,imgHeight * h);
		}
	}
}
/**
var message = new fabric.Text("Commands", {
	left: 0,
	top: 5,
	fontSize: 30,
	fill: 'blue',
	fontWeight: 'bold',
	originX: 'center',
	originY: 'center',
	strokeWidth: 2,
	opacity:0.5,
});

commands = new fabric.Group([cmdsBkgrnd, message],{
	fill:"yellow",
	width:100,
	height:gridHeight,
	opacity:0.3,
	left:clientWidth - 120,
	top:15
})


commands.addWithUpdate();

canvasMenu.add(message);
canvasMenu.add(commands);
}

canvasMenu.on('mouse:over', function(e) {
if(e.target == commands){
    e.target.set('opacity', '1');
    canvasMenu.renderAll();
}
});

canvasMenu.on('mouse:out', function(e) {
if(e.target == commands){
    e.target.set('opacity', '0.5');
    canvasMenu.renderAll();
}
});*/


var delImg = new fabric.Image(document.getElementById("delete"), {
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
var deleting = false;
var lastSelectedBlock = null;

var message = new fabric.Text("Face Robots!", {
	left: displayWidth/2,
	top: 30,
	fontSize: 40,
	fontFamily: 'Arial',
	fontWeight: 'bold',
	originX: 'center',
	originY: 'center',
	stroke: 'white',
	strokeWidth: 2
});

message.set('fill','green');

//used to guide landscape in creating player spawn site
var playerStartSize = 5;

var countLag = 0;

document.onkeydown = keyListener;

function initCanvas(){
	var canvWidth = numPiecesX * gridWidth;
	var canvHeight = numPiecesY * gridHeight
	canvas.setWidth(canvWidth);
	canvas.setHeight(canvHeight);
	canvas.calcOffset();
	canvasBG.width  = numPiecesX * gridWidth + (canvas._offset.left * 2); // in pixels
	canvasBG.height = numPiecesY * gridHeight + (canvas._offset.top * 2);
	canvasBG.style.left = "-" + canvas._offset.left + "px";
	canvasBG.style.top = "-" + canvas._offset.top + "px";

	var grassPic = document.getElementById("grass").style;
	grassPic.width = canvasBG.width + "px";
	grassPic.height = canvasBG.height + "px";

	//if(!setupGrass)
		//initGrass();
}



function changeState(code,doubleclick){
	//http://keycode.info/
	
	code = player.convertCode(code);
    if(code== "left"){
        //keyCode 37 is left arrow
        player.willSetMovement(-1,0,doubleclick);
    }
    else if(code== "right"){
        //keyCode 39 is right arrow
        player.willSetMovement(1,0,doubleclick);
    }
    else if(code== "up"){
        //keyCode 38 is up arrow
    	player.willSetMovement(0,-1,doubleclick);
    }
    else if(code== "down"){
        //keyCode 40 is down arrow
    	player.willSetMovement(0,1,doubleclick);
    }
    else if(code == "anticlockwise"){
    	//enter
    	if(player.willFinishRotating == -1) //not already rotating?
    		player.willRotate = -1;//anti-clockwise	}
    }
    else if(code == "clockwise"){
    	//shift
    	if(player.willFinishRotating == -1)
    		player.willRotate = 1;//clockwise
    }
    else if(code== "downstairs"){
    	if(activatedStairs != null)
    		willGoDownStairs = true;
    }
    else if(code == 32){ //space
    	//if(player.movX != 0 || player.movY != 0)
    		player.willStop = true;
    }
    else if(code == 83){ //'s' key = stop replay
    	//TODO - stick this here for now
    	alert(countLag);
    	saving = false;
    }
    else if(code >= 49 && code <= 58 && selectedKeyCodes == oldKeyCodes){ //original motor keycodes. number keys
    	player.stoppedPressingMotor = false;
    	player.motorWillStart = code - 49;
    }
    else if(code == 16 && selectedKeyCodes == newKeyCodes){ //new motor keycodes. shift fires selected motor
    	if(player.selectedMotor != null){
	    	player.stoppedPressingMotor = false;
	    	player.motorWillStart = player.selectedMotorInd;
    	}
    }
    else if(code == 38 && selectedKeyCodes == newKeyCodes) //new motor keycodes. up arrow increments selected motor
    	player.changeSelectedMotor(1);
    else if(code == 40 && selectedKeyCodes == newKeyCodes) //new motor keycodes. down arrow decrements selected motor
    	player.changeSelectedMotor(-1);
    else if(code==82){//r
		alert("Restarting!"); //(haven't implemented restart yet - hit refresh)");
    	startWholeGame();
    }
    else if(code==80){//p
    	cmdWindow.hidden = !cmdWindow.hidden;
    	paused = !paused;
    }
}

//if there are any items in inventory draw them on blue background
function initInventory(){

	invBackground = new fabric.Rect({
	  left: 0,
	  top: 0,
	  fill: 'blue',
	  width: clientWidth,
	  height: gridHeight * 2,
	  opacity: 0.3,
	  selectable: false
	});	
	canvas.add(invBackground);
	
	
	
	if(player != undefined && player.inventoryText != undefined){
		for(var i = 0; i < player.inventoryText.length; i+= 1){
			canvas.add(player.inventoryImages[i]);
			canvas.add(player.inventoryText[i]);
			
			player.inventoryImages[i].bringToFront();
			player.inventoryText[i].bringToFront();


		};
	};
	
	canvas.add(message);
}

window.onkeyup = function(e) {
    if(!(e.keyCode in [27, 17, 18, 8])) //only keys with default behaviour allowed = ESC, CTRL, ALT, DEL
		e.preventDefault();
	
	if(keyDangerZone)
		return; 
	
	if(inPVP){//multiplayer
		if(savedKeyPressUp.key != null)
			return;
		savedKeyPressUp = {time:counter4KeyCmds, rID:rivalID, key:e.keyCode};
		messageSentUp = true;
		//console.log("sending: ");
		//console.log(savedKeyPressUp);
		socket.emit("rivalKeyCodeUp",savedKeyPressUp);
	}
	else{
		changeStateUp(e.keyCode);
	}
};

slider.onchange = function(){
	difficulty = slider.value;		
};

cmdButton.onclick = function(){
	cmdWindow.hidden = !cmdWindow.hidden;
	paused = !paused;
};

switchBtn.onclick = function(){
	if(cmdText.innerHTML == oldKeyHTML){
		cmdText.innerHTML = newKeyHTML;
		selectedKeyCodes = newKeyCodes;
		switchBtn.innerHTML = "Change to Classic"
		player.updateKeyCodes();
	}
	else{
		cmdText.innerHTML = oldKeyHTML;
		selectedKeyCodes = oldKeyCodes;
		switchBtn.innerHTML = "Change to New"
		player.updateKeyCodes();
	}
};

function changeStateUp(code){
	code = player.convertCode(code);
	if((code >= 49 && code <= 58 && selectedKeyCodes == oldKeyCodes) || (code == 16 && selectedKeyCodes))//motors
		player.stoppedPressingMotor = true;
		
	if(code == "clockwise" || code == "anticlockwise")//finish rotation
		player.finishRotating();
}

window.onkeypress = function(e){
    if(!(e.keyCode in [27, 17, 18, 8])) //only keys with default behaviour allowed = ESC, CTRL, ALT, DEL
		e.preventDefault();
}


function keyListener(e){
    if(!(e.keyCode in [27, 17, 18, 8])) //only keys with default behaviour allowed = ESC, CTRL, ALT, DEL
		e.preventDefault();

	
	if(keyDangerZone)
		return;
	
	if(!willRestart){
		
	    if(!e){
	        //for IE
	        e = window.event;
	    }
		
	    	code = e.keyCode;
		var doubleClick = new Date - lastTime < 500 && lastKey == code;
		if(inPVP){//multiplayer
			if(savedKeyPress.key != null)
				return;
			savedKeyPress = {time:counter4KeyCmds, rID:rivalID, key:code, dc:doubleClick};
			messageSent = true;
			socket.emit("rivalKeyCode",savedKeyPress);
		}
		else
			changeState(code,doubleClick); //actually activate key code instruction - second parameter is true if doubleclicked
		lastTime = new Date;
		lastKey = code;
	}
}

canvas.on('selection:created', function(e) {
	reactToSelection(e);
}); 

canvas.on('selection:updated', function(e){
	reactToSelection(e);
});

function reactToSelection(e){
	if(usingSocket && e.target == curRival){
		alert("ENTERING PVP");
		jumpToRival();

	}
	else if(usingSocket && e.target == leftArrow){
		curRivalIDind -= 1;
		curRivalID = rivalGridIDs[curRivalIDind];
		updateRivalShown(rivalGrids[curRivalID],curRivalID);
	}
	else if(usingSocket && e.target == rightArrow){
		curRivalIDind += 1;
		curRivalID = rivalGridIDs[curRivalIDind];
		updateRivalShown(rivalGrids[curRivalID],curRivalID);
	}
	else{
		handleBlockSelection(e.target);
	}
}

canvas.on('selection:cleared', function(e) {
	player.deselected();
});

//for adding and removing blocks when editing player shape
function handleBlockSelection(block){
	if(block == delImg){
		deleting = true;
	}
	else if(block.isDamagedBlock){
		//message.set("text","Can't modify broken block!");
		//message.set('fill','red');
	}
	else if(block.isAddPlace){
		if(!deleting)
			player.convertAddPlace(block); //TODO only player can add/remove blocks for now. 
		else{								//when I give that functionality to enemies will need to redo and use "block.owner"
			message.set("text","Can't delete, No block selected!");
			message.set('fill','red');
		}
		canvas.setActiveObject(player.tryToSelectWhatIHadSelectedBefore(lastSelectedBlock));
	}
	else if(block.isDeletePlace){
		if(deleting){
			player.deleteBlock(block,true);
			canvas.setActiveObject(delImg);
		}
		else{
			//delete the block
			player.deleteBlock(block,false);
			//replace it with new
			block = gameGrid[block.myX][block.myY];
			if(block.isAddPlace)
				player.convertAddPlace(block);
			canvas.setActiveObject(player.tryToSelectWhatIHadSelectedBefore(lastSelectedBlock));
		}
	}
	else if(block.inventory != undefined){
		lastSelectedBlock = block.inventory;
		deleting = false;
		player.selectFromInventory(block.inventory);

	}
}

canvas.on('mouse:up', function(options) {
		player.finishEditBlockRotation();
})

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function callScrollLoop(){
	await sleep(scrollDelay)
	scrollLoop()
}

async function waitForTimeout(intv){
	await sleep(intv);
	oldTime = new Date();
	updateGame()
};


function scrollLoop(){
	if(scrollingX != 0){
		player.scrollInventory();
		window.scrollBy(scrollingX, 0);
		var pos = (window.pageXOffset || document.documentElement.scrollLeft);
		if(pos + scrollingX >= canvas._offset.left && pos + scrollingX <= maxScrollX)
			callScrollLoop();
		else if(pos <= canvas._offset.left || pos >= maxScrollX)
			endScroll();
		else{
			if(scrollingX < 0)
				scrollingX = pos - canvas._offset.left;
			else
				scrollingX = maxScrollX - pos;
		};
	}
	else if(scrollingY != 0){
		player.scrollInventory();
		window.scrollBy(0, scrollingY);
		var pos = (window.pageYOffset || document.documentElement.scrollTop);
		if(pos + scrollingY >= canvas._offset.top && pos + scrollingY <= maxScrollY)
			callScrollLoop();
		else if(pos <= canvas._offset.top || pos >= maxScrollY)
			endScroll();
		else{
			if(scrollingY < 0)
				scrollingY = pos - canvas._offset.top;
			else
				scrollingY = maxScrollY - pos;
		};

	}else
		endScroll();
	
}

//function errorLoop(){
//	if(oldUpdateIndex == updateIndex && !willGoDownStairs){ //hasn't been any updates in 5 * interval = CRASHED
//		alert("CRASHED!");
//		updateGame();
//	}
//	oldUpdateIndex = updateIndex;
//	setTimeout('errorLoop()',interval * 5);
//}
