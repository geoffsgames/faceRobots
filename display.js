document.body.style.overflow = 'hidden'; //prevent scrolling

var canvasBG = document.getElementById('canvasBG');
var context = canvasBG.getContext('2d');

var usingSocket = true;

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

//number of pieces actually shown on screen
//var numPiecesScreenX = Math.ceil(clientWidth / gridWidth);
//var numPiecesScreenY = Math.ceil(clientHeight / gridHeight);
//Changed to "typical" number because different numbers for different screens messes up multiplayer
var numPiecesScreenX = 43;
var numPiecesScreenY = 21;    


var code;
var invBackground;
var scrollSpeedup = 2;

var canEditRotations = false;
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
	var img=document.getElementById("grass");
	var imgWidth =img.width;
	var imgHeight = img.height;
	for(var w =0; w < Math.ceil(canvWidth / imgWidth); w++){
		for(var h =0; h < Math.ceil(canvHeight / imgHeight); h++){
			context.drawImage(img,imgWidth * w,imgHeight * h);
		}
	}
	//context.fillStyle = "#DAF7A6";
	//context.fillRect(0,0,numPiecesX * gridWidth,numPiecesY * gridHeight);
}



function changeState(code,doubleclick){
	//http://keycode.info/
   //TEST - pause for one second to simulate lag
   if(code == 80) //p
	willLag = true;	
   if(code == 81) //q
	willLag = false;	
	
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
    else if(code== 68){//d - down stairs
    	if(activatedStairs != null)
    		willGoDownStairs = true;
    }
    else if(code == 32){ //space
    	if(player.movX != 0 || player.movY != 0)
    		player.willStop = true;
    }
    else if(code == 83){ //'s' key = stop replay
    	//TODO - stick this here for now
    	alert(countLag);
    	saving = false;
    }
    else if(code >= 49 && code <= 58){ //numbers
	player.stoppedPressingMotor = false;
    	player.motorWillStart = code - 49;
    }
    else if(code==82){//r
		alert("Restarting!"); //(haven't implemented restart yet - hit refresh)");
		canvas.clear();

    	startWholeGame();
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

function changeStateUp(code){
	if(code >= 49 && code <= 58) //motors
		player.stoppedPressingMotor = true;

	if(code == 13 || code == 16)//finish rotation
		player.finishRotating();
}


function keyListener(e){
	if(keyDangerZone)
		return;
	
	if(!willRestart){
		
	    if(!e){
	        //for IE
	        e = window.event;
	    }
		
	    if((e.keyCode >= 37 && e.keyCode <= 40) || (e.keyCode >= 32 && e.keyCode <= 34))
	    		e.preventDefault();
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
	if(block == delImg)
		deleting = true;
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

//function errorLoop(){
//	if(oldUpdateIndex == updateIndex && !willGoDownStairs){ //hasn't been any updates in 5 * interval = CRASHED
//		alert("CRASHED!");
//		updateGame();
//	}
//	oldUpdateIndex = updateIndex;
//	setTimeout('errorLoop()',interval * 5);
//}
