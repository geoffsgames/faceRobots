"use strict";

//some of these may be made "const" but compatibility issues http://stackoverflow.com/questions/130396/are-there-constants-in-javascript

var debugMode = false;
var randsSeeded = false; //normally random numbers for building landscape are seeded but not AI or random events - this makes them also seeded for debugging
var scrollingX = 0;
var scrollingY = 0;
var gameGrid = null;
var numPiecesX, numPiecesY; //total blocks in the landscape

//user controlled seed to start seed creation
Math.seed = Math.round(Math.random() * 10000);
var s = prompt("Entering world: " + Math.seed + " or enter number of alternative world: ");
if(s != null && !isNaN(parseInt(s, 10)))
	Math.seed = parseInt(s, 10);
var origSeed = Math.seed;

////main seeds
var startGlobalSeed = Math.seededRandomDouble();//for universe when I first start playing
var globalSeed = startGlobalSeed;//for current universe (changes when go through portal)
var startSeed = Math.seededRandom(1000000,2000000); //for current arena
var curSeed = startSeed;
var seedJumpX = 1000; //seed increments/decrements every time go horiz/verti
var seedJumpY = 1;

var land;//current arena
var leftGrid, rightGrid, topGrid, bottomGrid; //the next grids along
var allLandscapes = [];



////enemy
var willAddEnemy = false;
var selectedSpawn = null;
var intervalToNextEnemy = getEnemyInterval();
var enemy;
//enemy fade in
var frozeWaitingForEnemy = true;//enemy fade in taking too long - keeps synched so enemy always starts on same frame regardless of delays in animation
var arrivalTime = 0; //game loop number where enemy first initialised to check finish of fade in sequence
////thief
var thiefProb = 0.4; //thiefProb * number of special blocks on arena is probability thief will appear...
var maxThiefProb = 0.9; //... up to this maximum 
var minThiefProb = 0.01; //... and always at least minimum
//thief will never aware if no collectables
var handyThiefProb = 0; //unused for now
var willAddThief = false; //only set to true when enemy killed and thief will be soon arriving
var oldEnemy; //for thief - enemy that was on arena before thief turned up

var messageTimer = 0; //messages only display short period of time

var player;

var timeStamp = 0; //unpdates every game loop

var willRestart = null; //when I'm about to enter a new landscape this stores the land I'm about to enter

////stairs
var activatedStairs = null;
var willGoDownStairs = false;
var goingDownStairs = false;

////collectables
var collectables = [];
var newCollectables = [];
var potentialCollectables = [];
var numSpecialCols = 0; //weapons and specials

////Motors
var testingMotors = false;
var testingNoRotateDelay = false;

////PVP
var enteringRival = false; //don't respond to any input when entrance of rival animation happening
var inPVP = false;
var rivalCompleted = false; //rival completed a single gameloop so don't have to wait for them
var counter4KeyCmds = 0; //records which iteration we're on so key commands attached to right one
var keyMessage = null; //stores key commands received from rival
var messageSent = false; //I've sent a key event message to other
var returnedKeyMessage = null; //message returned after I send a key event message
var waitReturnedKeyMessage = false; //pause until have received other's reply to my message confirming it has implemented it
var keyDangerZone = false; //in section of code will ignore key commands could cause synch issues even with all the other checks
var rivalAddDelBlocks = []; //blocks rival has added in edit mode
var socket = null;
var checkPVP = null;
//same variables but for keyup events
var keyMessageUp = null; //stores key commands received from rival
var messageSentUp = false;
var returnedKeyMessageUp = null;
var waitReturnedKeyMessageUp = false;

//loading/saving - not currently used
var loading = false;

var animating = true;

var updatingPlayer;

var oldTime2 = null;

var lastKeyCounter = null;

var paused = false;


/////////////////////////start game
start();
addPlayer();
oldTime = new Date();
updateGame();
enemy.extractFromOverlap(20,true);//attempts to prevent enemy starting while overlapping a wall
var animLoop = requestAnimationFrame(renderLoop);


message.set("text", "World " + origSeed);



//for restarting after death
function restartAfterDeath(){
	console.log("restarting");
	changedBlocks = undefined;
	globalSeed = startGlobalSeed;
	leftGrid = undefined;
	rightGrid = undefined;
	topGrid = undefined;
	bottomGrid = undefined;
	allLandscapes = [];
	curSeed = startSeed;
	start();
	enemy = null;
	emptyInventory(); //note that actual inventory will be cleared by creating a new player - this just clears it visually hense in display
	addPlayer();
	oldTime2 = null;
	oldTime = new Date();
	updateGame();
}

//how long after one enemy dies for next enemy to appear
function getEnemyInterval(){
	if(Math.seededRandomDouble() < 0.9)
		return 1;
	else
		return Math.seededRandom(10,20);
	
}

//enter new arena or start game
function start(){
	canvas.clear();
	numPlayers = 2;
	if(enemy != undefined && enemy != null)
		enemy.readyToMove = false; 

	if(loading)
		loadGame();
	land = allLandscapes[curSeed];//if moving from one landscape to the next curSeed (identifying new land) will have been set

	//should only happen at the start of the game for now
	//if scrolling off grid new landscape will be recorded before I scroll off
	if(land == undefined || land == null){
		land = new Landscape(curSeed, globalSeed);
		allLandscapes[curSeed] = land;
		//for loading from a saved game
		if(changedBlocks != undefined){
			land.changedBlocks = changedBlocks;
		}
		
	}
	gameGrid = land.grid;
	var alreadyHadGrid = !(gameGrid == undefined || gameGrid == null);
	if(!alreadyHadGrid)
		gameGrid = land.makeGrid();
	numPiecesX = gameGrid.length;
	numPiecesY = gameGrid[0].length;	
	displayWidth = numPiecesX * gridWidth;
	displayHeight = numPiecesY * gridHeight;
	maxScrollX = displayWidth - clientWidth;
	maxScrollY = displayHeight - clientHeight;
	initCanvas();
	
	drawBlocks();
	drawStairs();
	drawSpawns();
	initInventory();

	invBackground.bringToFront();
	willAddEnemy = true;
	
	message.set("fill","blue");
	message.set("text", "World " + origSeed);
	//willAddThief = true;
	//handyThief = true;
}



function drawSpawns(){//for enemies
	for(var i =0 ; i < land.enemyXs.length; i += 1){
		
		var image = new fabric.Image(document.getElementById("spawn"), {
			left: (land.enemyXs[i] + 2) * gridWidth,
			top: (land.enemyYs[i] + 2) * gridHeight,
			width: gridWidth,
			height: gridHeight,
			opacity: 0.2
		});
		image.selectable = false;
		canvas.add(image);
		land.enemyImages[i] = image
	};
}

function addStandardPlayerPieces(rob){
	/**
	for(var x = 0; x < 10; x++){
		for(var y = 0; y < 10; y++){
			if(x == 5 && y == 5)
				rob.addPiece(x, y, "heart")
			else
				rob.addPiece(x, y,"wall");
		}
	}*/
	
	rob.addPiece(1,0,"wall");
	rob.addPiece(2,0,"wall");
	rob.addPiece(0,0,"wall");
	rob.addPiece(1,1,"heart");
	rob.addPiece(2,1,"wall");
	rob.addPiece(0,1,"wall");
	rob.addPiece(1,2,"wall");
	rob.addPiece(2,2,"wall");
	rob.addPiece(0,2,"wall");
	rob.addPiece(1,3,"knife");
}

function addPlayer(){
	if(playerStr == undefined){ //if aren't loading player from saved game
		player = new Player(land.playerX,land.playerY,2);

		addStandardPlayerPieces(player);

		
		player.totalNumBlocks = 10;
		player.setupWeapons();

	}
	else{
		player = new Player();
		player.loadFromText(playerStr);
	}	
	player.heart.image.bringToFront();
	//scroll so I of middle screen
	scrollToPlayer();

	if(testingMotors){
		stoppedPressingMotor = false;
		player.motorWillStart = 0;
	}
	/**
	for(var i =0 ; i < 40; i += 1){
		player.addBlockToInventory("wall");
		
		player.addBlockToInventory("knife");
		player.addBlockToInventory("motor");
		player.addBlockToInventory("spring");
		player.addBlockToInventory("fan");


	}*/
	
	player.group.bringToFront();
}

function addRival(){
	

	
	if(playerStr == undefined){ //if aren't loading player from saved game
		player = new Player(land.playerX,land.playerY,2);

		addStandardPlayerPieces(player);

		
		player.totalNumBlocks = 10;
		player.setupWeapons();

	}
	else{
		player = new Player();
		player.loadFromText(playerStr);
	}	
	player.heart.image.bringToFront();
	//scroll so I of middle screen
	scrollToPlayer();

	if(testingMotors){
		stoppedPressingMotor = false;
		player.motorWillStart = 0;
	}
	
	/**
	for(var i =0 ; i < 10; i += 1){
		player.addBlockToInventory("wall");
		
		player.addBlockToInventory("knife");
		player.addBlockToInventory("motor");
		player.addBlockToInventory("spring");

	}*/
	
	player.group.bringToFront();
}

//for start of game
function scrollToPlayer(){
	
	window.scrollTo(Math.round(Math.max(canvas._offset.left,(player.myX * gridWidth) - (clientWidth / 2))), 
			Math.round(Math.max(canvas._offset.top,(player.myY * gridHeight) - (clientHeight / 2))));
	
	player.scrollInventory(true);

}

function scrollToEnemy(){	
	window.scrollTo(Math.round(Math.max(canvas._offset.left,(enemy.myX * gridWidth) - (clientWidth / 2))), 
			Math.round(Math.max(canvas._offset.top,(enemy.myY * gridHeight) - (clientHeight / 2))));
}

//scenery blocks drawn at wonky angles to look more interesting
function addRandomDirScenery(x,y,type){
	var pointX, pointY;
	if(Math.maybeSeededRandom(0,0.5))//random horizontal or vertical
		pointX = (Math.round(Math.maybeSeededRandom(0,1)) * 2) - 1; //either 1 or -1
	else
		pointY = (Math.round(Math.maybeSeededRandom(0,1)) * 2) - 1; //either 1 or -1

	addScenerySquare(x,y,type, pointX, pointY);

}

function drawStairs(){
	for(var i =0; i < land.stairs.length; i+= 1){
		var image = new fabric.Image(document.getElementById("stairs"), {
			left: land.stairs[i].x * gridWidth,
			top: land.stairs[i].y * gridHeight,
			width: gridWidth * 2,
			height: gridHeight * 2,
		});
		image.selectable = false;
		land.stairs[i].image = image;
		canvas.add(image);
	}
}

//draw obstacle blocks on landscape
function drawBlocks(){	
	gameGrid.setup = true;
	for(var x = 0; x < numPiecesX; x+= 1){//step across play area grid
		for(var y = 0; y < numPiecesY; y += 1){
			if(gameGrid[x][y] != 1)
				addRandomDirScenery(x,y,"obstacle");//this code because wall blocks are only actually drawn if on the edges (otherwise too CPU intensive)
		};
	}
	
	//all the bits of wall which were damaged when last in this area draw as wonky
	for(var i =0; i < land.changedBlocks.length; i += 1){
		var x = land.changedBlocks[i][0];
		var y = land.changedBlocks[i][1];
		if(gameGrid[x][y] == undefined || gameGrid[x][y] == 1)
			addRandomDirScenery(x,y,"obstacle");
		gameGrid[x][y].resistance = land.changedBlocks[i][2];
		gameGrid[x][y].showDamage();
		if(gameGrid[x][y].resistance <= 0){//remove blocks completely destroyed last time
			gameGrid[x][y].drawBackground();
			gameGrid[x][y].clearAway(false);
		};
	};
}

//obstacle blocks
function addScenerySquare(x, y, blocktype, pointX, pointY){
	if(gameGrid[x] == null)
		gameGrid[x] = new Array(numPiecesY);
	else if(gameGrid[x][y] != null && gameGrid[x][y] != undefined && gameGrid[x][y] != 1 && gameGrid[x][y] != 2){
		if(gameGrid[x][y].type == blocktype && gameGrid[x][y].owner == null){//if what we're trying to add is already recorded in grid
			//means we don't have to physically add it to grid so only need to add it to display
			//(this will happen if we re-enter a landscape we already have saved)
			gameGrid[x][y].drawImage();
			
		}
		return;
	}
	//add it to display and to grid if obstacle
	var owner = canvas;
	if(blocktype == "obstacle")//scenery not collectable = draw to background
		owner = context;
	addGridSquare(x, y, blocktype, gameGrid, owner, null, 0 , 0,pointX,pointY);
}

//adds to "grid" which would be either gameGrid or player's grid
//x, y position within owner
//offsetX, offsetY for how the fabric groups are constructed TODO switch to addWithUpdate
//pointX, pointY for direction knives etc pointing (not used right now - calculated with knife)
function addGridSquare(x, y, blocktype, grid, ownerImage, owner, offsetX, offsetY,pointX,pointY) {	
	if(blocktype == "knife")
		grid[x][y] = new Knife(blocktype, grid, ownerImage, owner, x, y, offsetX, offsetY,pointX,pointY);
	else if(blocktype == "crystal")
		grid[x][y] = new Crystal(blocktype, grid, ownerImage, owner, x, y, offsetX, offsetY,pointX,pointY);
	else if(blocktype == "heart")
		grid[x][y] = new Heart(blocktype, grid, ownerImage, owner, x, y, offsetX, offsetY,pointX,pointY);
	else if(blocktype == "obstacle")
		grid[x][y] = new Obstacle(blocktype, grid, ownerImage, owner, x, y, offsetX, offsetY,pointX,pointY);
	else if(blocktype == "motor")
		grid[x][y] = new Motor(blocktype, grid, ownerImage, owner, x, y, offsetX, offsetY,pointX,pointY);
	else if(blocktype == "fan")
		grid[x][y] = new Fan(blocktype, grid, ownerImage, owner, x, y, offsetX, offsetY,pointX,pointY);
	else if(blocktype == "chain")
		grid[x][y] = new Chain(blocktype, grid, ownerImage, owner, x, y, offsetX, offsetY,pointX,pointY);
	else if(blocktype == "spring")
		grid[x][y] = new Spring(blocktype, grid, ownerImage, owner, x, y, offsetX, offsetY,pointX,pointY);	
	else if(blocktype == "hand")
		grid[x][y] = new Hand(blocktype, grid, ownerImage, owner, x, y, offsetX, offsetY,pointX,pointY);	
	else if(blocktype == "blinder")
		grid[x][y] = new Blinder(blocktype, grid, ownerImage, owner, x, y, offsetX, offsetY,pointX,pointY);	
	else if(blocktype == "scrambler")
		grid[x][y] = new Scrambler(blocktype, grid, ownerImage, owner, x, y, offsetX, offsetY,pointX,pointY);	
	else
		grid[x][y] = new Block(blocktype, grid, ownerImage, owner, x, y, offsetX, offsetY,pointX,pointY);
	//canvas.renderAll();
};

//if in replay mode and replaying the player modifying their robot
function replayAddPieces(textGrid){
	player.redrawFromTextGrid(textGrid);//how they modified it will have been saved in the textGrid
}

function wakeRotateWait(){
	//console.log(new Date().getTime() - startTime);
	waitingForRotate = false;
}

function updateGame(){
	if(paused){
		for(var i = 0; i < numPlayers; i++)
			allComplete();
		return;
	}
	
	if(checkPVP != null && checkPVP()) //possibly move into PVP - suspends main gameloop and will implement new one
		return;
	
	//failsafe enemy.isEnemy should ONLY be false for non null enemy's in PVP
	if(enemy != null && !enemy.isEnemy && !inPVP){
		console.error("something went wrong with entering PVP")
		return;
	}
	
	if(inPVP)
		if(updateGamePVP() == -1) //extra potential wait loop required in PVP to ensure key presses are kept in sync. Method in socEvents like all PVP stuff
			return;
	if(updateGame2() == -1)
		return;
}

function updateGamePVP(){
	
	if(messageSent && returnedKeyMessage == null){
		waitReturnedKeyMessage = true;
		return(-1);
	}
	waitReturnedKeyMessage = false;
	messageSent = false;
	
	//console.log("keyzone " + counter4KeyCmds);
	if(lastKeyCounter != null && counter4KeyCmds - lastKeyCounter > 1)
		alert("keycounter error: " + (counter4KeyCmds - lastKeyCounter))
	lastKeyCounter = counter4KeyCmds;
	
	keyDangerZone = true;
	//keyCodes during PVP = rival's key codes
	if(keyMessage != null){
		//console.log("doing his: " + keyMessage + " TIME " + counter4KeyCmds);
		//console.log(keyMessage)
		if(keyMessage.time <= counter4KeyCmds){ //if he sent it at n we know he won't do it until n + 1
			changeStateEnemy(keyMessage.key,keyMessage.dc);
			keyMessage = null
		}
	}
	if(savedKeyPress.key != null){
		//console.log("doing mine: SAV " + savedKeyPress + " RET " + returnedKeyMessage + " TIME " + counter4KeyCmds);
		//console.log(savedKeyPress)
		//console.log(counter4KeyCmds)
		if(counter4KeyCmds >= returnedKeyMessage.time){
			changeState(savedKeyPress.key, savedKeyPress.dc); //actually activate key code instruction - second parameter is true if doubleclicked
			savedKeyPress = {key:null}
			returnedKeyMessage = null;
		}
	}
	
	
	
	
	//////same with keyup
	if(messageSentUp && returnedKeyMessageUp == null){
		waitReturnedKeyMessageUp = true;
		return(-1);
	}
	waitReturnedKeyMessageUp = false;
	messageSentUp = false;
	
	//keyCodes during PVP = rival's key codes
	if(keyMessageUp != null && keyMessageUp.time <= counter4KeyCmds){ //if he sent it at n we know he won't do it until n + 1
		changeStateEnemyUp(keyMessageUp.key);
		keyMessageUp = null
	}
	if(savedKeyPressUp.key != null && counter4KeyCmds >= returnedKeyMessageUp.time){
		changeStateUp(savedKeyPressUp.key); //actually activate key code instruction - second parameter is true if doubleclicked
		savedKeyPressUp = {key:null}
		returnedKeyMessageUp = null;
	}
	keyDangerZone = false;
}

function updateGame2(){
	if(!inPVP && oldTime2 != null){
		//shouldn't happen as updateGame() in display should handle the delays completely - this is just a failsafe, with appropriate error message
		var actualIntv = new Date() - oldTime2; 
		if((interval * 0.7) > actualIntv){
			console.error("something went wrong with timing");
			waitForTimeout(interval - actualIntv);
			return(-1);
		}
	}
	oldTime2 = new Date();
	
	//ensures commands from PVP players are executed same gameloop
	if(inPVP)
		counter4KeyCmds ++;

	//TESTING - just for testing lag
	/**
	if(willLag){
		var time = new Date;
		while(new Date - time < 1000){
		}
	}*/
	//END TESTING
	
	
	//when interval is shortened (someone moving at speed) rotation takes multiple turns so doesn't appear superfast 
	//while multi turn rotation animation underway obviously don't want anything else to happen
	if(!reallyWaitingForRotate){  
		if(willAddThief && !player.partsMoving && !intermediate){
			addThief();
			message.set("text","Thiefbot has appeared!");
			message.set('fill', 'blue');
			messageTimer = 10;
			player.changedDir = true;
			player.changeDir(true);
		}
		else if(willAddEnemy && !player.partsMoving && !intermediate){
			addEnemy();
			enemy.willshrink = true;
			player.changedDir = true;
			player.changeDir(true);
		}
		messageTimer -= 1;
		if(messageTimer == 0 && message.text == "Thiefbot has appeared!"){
			message.set("fill", "green");
			message.set("text","World " + origSeed);
		}
		oldInterval = interval;
		
		//enemy fade in taking too long;
		frozeWaitingForEnemy = false;
		if(debugMode && timeStamp == (fadeFrames - arrivalTime) && !enemy.readyToMove) 
			frozeWaitingForEnemy = true;
		
		if(!frozeWaitingForEnemy)
			timeStamp += 1;
	//	if(saving && timeStamp % saveGameInterval == 0){
	//		console.clear();
	//		saveGame();
	//	}
		if(debugMode){
			//replaying for debugging
			if(playingBack){
				while(timeStamp == times[nextTime]){
					if(codes[nextTime].startsWith("addpiece")) //will happen just before move
						replayAddPieces(codes[nextTime].replace("addpiece",""));
					else
						changeState(parseInt(codes[nextTime]));
					nextTime += 1;
				}
			}
			else{//record so can replay later
				if(code != 0){//code = record of key just pressed
					if(player.justLeftEditMode){
						player.saveTextGrid();
						player.justLeftEditMode = false;
					}
					console.log(timeStamp + ":" + code);
				}
				code = 0;
			}
		}

	
	}
	if(willGoDownStairs && !goingDownStairs && !reallyWaitingForRotate){
		goingDownStairs = true;
		player.animateDownStairs();
	}
	else{
		if(!reallyWaitingForRotate){
			goingDownStairs = false;
			//check to see if any collectables have finished their "fly away" animation and are ready to be added to the grid
			addCollectables();
		}
		if(player.dead && !reallyWaitingForRotate){
			alert("You have lost!");
			enemy.die(false);
			willAddThief = false;
			restartAfterDeath();
		}
		else{
			if(!reallyWaitingForRotate){
				if(inPVP && player.isInvader){ //switch order of player and enemy in PVP to ensure it's the same on both machines
				   	enemy.checkIntermediate();
					if(!enemy.justResumed) //if just stopped the motors I've effectively already checked intermediate so rechecking could create clash (Check??? Old code commented late)
						player.checkIntermediate();
				}
				else{
					player.checkIntermediate();
					if(!player.justResumed && enemy.readyToMove) //if just stopped the motors I've effectively already checked intermediate (Check??? Old code commented late)
						enemy.checkIntermediate();
				}
			}
			if(!intermediate){				
				if(waitingForRotate){
					
					if(!testingNoRotateDelay){
						if(!reallyWaitingForRotate){
							//startTime = new Date().getTime();
							//console.log("angle " + (enemy.group.angle % 90));
						}
						reallyWaitingForRotate = true;
						waitForTimeout(10);
						return;
					}
				}
				player.rotation = 0;
				enemy.rotation = 0;
				//if(player.motors[0].group != undefined)
				//	console.log((new Date().getTime() - startTime) + " " + player.motors[0].group.left);
				//startTime = new Date().getTime();
			}
			reallyWaitingForRotate = false;

			
			
			player.justResumed = false;
			enemy.justResumed = false;
			
			//changing direction commands or moving motors
			if(inPVP && player.isInvader){ //switch order of player and enemy in PVP to ensure it's the same on both machines
				//both players respond to any commands
				enemy.tryToChangeDir();
				player.tryToChangeDir(); //includes leave edit mode
			}
			else{
				player.tryToChangeDir();
				if(inPVP) //not a rival in two player mode
					enemy.tryToChangeDir();
				else
					enemy.intelligence();
			}
			
			//change interval in response to moving motors/change of direction
			if(inPVP && player.isInvader){ //switch order of player and enemy in PVP to ensure it's the same on both machines
				enemy.tryToSpeedUp();
				player.tryToSpeedUp();
			}
			else{
				player.tryToSpeedUp();
				enemy.tryToSpeedUp();
			}
			if(inPVP)
				 addDelRivalBlocksImpl(); //if rival is building add/delete blocks
			
			//main update loop (actually moving/animation/collision detection)
			if(inPVP && player.isInvader){ //switch order of player and enemy in PVP to ensure it's the same on both machines
				enemy.update();
				player.update();
			}
			else{
				player.update();
				enemy.update();
			}
		}
	}
}

/**
function countBlocks(){
	tot = 0
	for(var x = 0; x < gameGrid.length; x += 1){
		for(var y = 0; y < gameGrid[0].length; y += 1){
			if(gameGrid[x][y] != undefined && gameGrid[x][y] != 1)
				tot += 1;
		}
	}
	return(tot);
}*/
	
function compareCol(a, b){
	if(a.val > b.val)//prioritise weapons/specials
		return -1;
	else if(a.val < b.val)
		return 1;
	else{
	    if(a.dis < b.dis) //next consider distance
	            return -1;
	    else if(a.dis > b.dis)
	            return 1;
	    else
	            return (Math.round(Math.maybeSeededRandom(0,1)) * 2) - 1;
	}

}

//produce a list of collectables sorted from most attractive to thief (special, close to a wall so accessible) to least (plain block, far from wall)
function getImportanceFromCols(cols, colImports){
	for(let col of cols){
		var val = 0;
		if(col.weap)
			val++;
		else if(col.spec)
			val++;
		var rightDis = numPiecesX - col.x;
		var bottomDis = numPiecesY - col.y;
		var leftDis = col.x;
		var topDis = col.y;
		
		//create colImportance entry for accessing the collectable from left or right (whichever closest)
		var disX, side;
		if(rightDis < leftDis){
			side = 2;
			disX = rightDis;
		}
		else if(leftDis < rightDis){
			side = 0;
			disX = leftDis;
		}
		else
			side = Math.round(Math.maybeSeededRandom(0,1)) * 2;
		colImports.push({dis:disX, across:col.y, side, val});
		
		//create colImportance entry for accessing the collectable from top or bottom (whichever closest)
		var disY;
		if(topDis < bottomDis){
			side = 1;
			disY = topDis;
		}
		else if(bottomDis < topDis){
			side = 3;
			disY = bottomDis;
		}
		else
			side = (Math.round(Math.maybeSeededRandom(0,1)) * 2) + 1;
		colImports.push({dis:disY, across:col.x, side, val})
	}
}

function addThief(){
	console.log("adding thief");
	oldEnemy = enemy;
	var side, across; //left up right down
	var tooFar = true;
	var startX = 0;
	var startY = 0;
	var dir = 0;
	var attempts = 100;
	var i =0;
	var movX = 0;
	var movY = 0;
	
	//for choosing an entry point close to, respectively collectables already stopped on grid, collectables flying and collectables stopped on grid but waiting to be added to main list
	var colImportances = [];
	getImportanceFromCols(collectables,colImportances);
	getImportanceFromCols(potentialCollectables,colImportances);
	getImportanceFromCols(newCollectables,colImportances);
	colImportances = colImportances.sort(compareCol,colImportances);

	
	while(tooFar && i < attempts){
		movX = 0;
		movY = 0;
		var colImport = colImportances[i % (colImportances.length - 1)];		
		side = colImport.side;
		across = colImport.across;
		
		i ++;
		
		//when creating thief knife at top
		if(side == 0){//left
			//face right
			movX = 1;
			dir = 1;
			startX = 0;
			startY = across;
		}else if(side == 1){//top
			movY = 1;
			dir = 2;
			startX = across;
			startY = 0;
		}else if(side == 2){//right
			movX = -1;
			dir = 3;
			startX = numPiecesX;
			startY = across;
		}else{//down
			movY = -1;
			dir = 0;
			startX = across;
			startY = numPiecesY;
		};
		if(gameGrid[startX + (movX * 3)][startY + (movY * 3)] == 1)//facing space
			tooFar = false;//then we found a good spot- keep
	}
	
	if(handyThief)
		enemy = new HandyThief2(startX,startY,0);
	else
		enemy = new Thief(startX,startY,0);
	//move off screen
	if(dir == 1)
		enemy.myX = enemy.myX - enemy.gridSize;
	else if(dir == 2)
		enemy.myY = enemy.myY - enemy.gridSize;

	enemy.setupWeapons();
	
	enemy.rotation = dir;
	if(dir == 3)
		enemy.rotation = -1; 
	for(var i =0; i < Math.abs(enemy.rotation); i+= 1)
		enemy.rotate();
	enemy.shrink();
	
	enemy.movX = movX;
	enemy.movY = movY;
	

	clearThiefsPassage(movX, movY,enemy.myX + enemy.minX,enemy.myY + enemy.minY, enemy.width, enemy.minX, enemy.minY);
	willAddThief = false;
}

//clears passage thief came through from neighbouring land
function clearThiefsPassage(movX, movY, thiefX, thiefY, width, minX, minY){
	var adjacentX, adjacentY; //where the passage starts in the neighbouring land - i.e. neighbouring land co-ords adjacent to thief's location in this land
	var allowedDis = 0;
	var thiefLand = null;
	if(movX == 1){
		leftGrid = generateNextGrid(leftGrid, -seedJumpX)
		thiefLand = leftGrid;
		adjacentY = newXYForNeighbour(leftGrid,thiefY,width,gameGrid[0].length,leftGrid.grid[0].length,leftGrid.grid.length, true, "right");
		adjacentX = leftGrid.grid.length - 1; //starts at far right end of grid coming from
		allowedDis = adjacentX;
	}
	else if(movX == -1){
		rightGrid = generateNextGrid(rightGrid, seedJumpX)
		thiefLand = rightGrid;	
		adjacentY = newXYForNeighbour(rightGrid,thiefY,width,gameGrid[0].length,rightGrid.grid[0].length, rightGrid.grid.length,true,"left");
		adjacentX = 0;
		allowedDis = rightGrid.grid.length - 1;
	}
	else if(movY == 1){
		topGrid = generateNextGrid(topGrid, -seedJumpY)
		thiefLand = topGrid;
		adjacentX = newXYForNeighbour(topGrid,thiefX,width,gameGrid.length,topGrid.grid.length, topGrid.grid[0].length,true,"bottom");
		adjacentY = topGrid.grid[0].length - 1; //starts at far bottom end of grid coming from
		allowedDis = adjacentY;
	}
	else if(movY == -1){
		bottomGrid = generateNextGrid(bottomGrid, seedJumpY)
		thiefLand = bottomGrid;
		adjacentX = newXYForNeighbour(bottomGrid,thiefX,width,gameGrid.length,bottomGrid.grid.length, bottomGrid.grid[0].length,true,"top");
		adjacentY = 0;
		allowedDis = bottomGrid.grid[0].length - 1;
	}
	var thiefChanged = thiefLand.changedBlocks;
	
	var allClear = false;
	var step = 0;
	while(!allClear && Math.abs(step) < (allowedDis * 0.75)){	//clearing a passage in *it's own land* by working backwards.
		
		allClear = true;
		for(var i =0; i < width; i += 1){
			
			//thief moving vertically
			var x = adjacentX + i;
			var y = adjacentY + step;
			if(movY == 0){
				//thief moving horizontally
				var x = adjacentX + step;
				var y = adjacentY + i;

			}
			//destroy block
			thiefChanged.push([x, y, -1]);
			
			//check if in clearing yet
			if(thiefLand.grid[x][y] != 1)
				allClear = false;
		}
		if(movX == -1 || movY == -1)
			step += 1;
		else
			step -= 1;
	}
	if(!allClear) //if tried to move across most of the landscape but still not managed to clear passage
		addThief()//then try creating thief all over again
}

//grid of next arena is generated when player gets near edge of this arena
function generateNextGrid(grid, seedJump){
		if(grid == undefined || grid == null){
			var newSeed = curSeed + seedJump;
			grid = allLandscapes[newSeed];
			if(grid == undefined || grid == null){
				grid = new Landscape(newSeed, globalSeed);
				allLandscapes[newSeed] = grid;
			}
			
		}
		if(grid.grid == undefined)
			grid.makeGrid();
		return grid;
}

function addEnemy(){
	willAddEnemy = false;
	var which = Math.floor(Math.maybeSeededRandom(0,land.enemyXs.length));
	
	if(enemyStr == undefined){//not loading from saved game
		enemy = new Enemy(land.enemyXs[which],land.enemyYs[which],0);
		
		//choose spawning site
		enemy.area = land.enemyAreas[which];
		
		//build enemy in shape associated with this landscape
		var enemyGrid = land.enemyGrid;
		var enemySize = land.enemyGrid.length;
	

		for(var x =0; x < enemySize; x+= 1){
			for(var y =0; y < enemySize; y+= 1){
				if(enemyGrid[x][y] != undefined){
					enemy.totalNumBlocks += 1;
					var type = enemyGrid[x][y].type
					enemy.addPiece(x,y,type);
					if(type == "spring")
						enemy.grid[x][y].increment(enemyGrid[x][y].springStrength - 1);
				};
			};
		};


	}else{
		enemy = new Enemy();
		enemy.loadFromText(enemyStr);
		enemy.AIcountDown = enemyInt;
	
	}
	
	enemy.heart.image.bringToFront();
	enemy.extractFromOverlap(20,true);
	enemy.recreateGroup(0,0);
	enemy.setupWeapons();
	
	if(enemy.movX == 0 && enemy.movY == 0){
		//enemy entrance animation - starts small and faint and overlapping spawn site and enlarges, grows opaque and moves to actual location
		
		//spawnsite
		land.enemyImages[which].opacity = 1; 
		selectedSpawn = land.enemyImages[which];
		
		//enemy
		enemy.group.left = (land.enemyXs[which] + 2) * gridWidth;
		enemy.group.top = (land.enemyYs[which] + 2) * gridHeight;
		enemy.group.scaleX = gridWidth / enemy.actualWidth;
		enemy.group.scaleY = gridHeight / enemy.actualHeight;
		enemy.fadeIn();
	}else{
	
		enemy.readyToMove = true;
	};
	enemy.group.bringToFront();
	
}

//add collectables to game grid after flying off animation
function addCollectables(){
	//newCollectables contain the collectables that have landed but not been added to the grid. Add them now
	while(newCollectables.length > 0){
		var col = newCollectables.pop();

		//remove each from the set of collectables currently flying through the air
		var foundPotential = false;
		for(var i =0; i < potentialCollectables.length && !foundPotential; i++){
			if(potentialCollectables[i].x == col.x && potentialCollectables[i].y == col.y){
				foundPotential = true;
				potentialCollectables.splice(i,1);
			}
		}
		
		var newPos = outFromUnderRobot(col.x,col.y);
		if(newPos != null){
			col.x = newPos.newX;
			col.y = newPos.newY;
			//add each to the grid
			if(gameGrid[col.x][col.y] == 1){
				collectables.push(col);
				addRandomDirScenery(col.x, col.y, col.type);
				gameGrid[col.x][col.y].collectable = true;
				gameGrid[col.x][col.y].redraw(true); //for collectable colour
			}
		}
		
	}

}

function renderLoop(){
	canvas.requestRenderAll();
	fabric.util.requestAnimFrame(renderLoop);
}

function endScroll(){
	scrollingX = 0;
	scrollingY = 0;
	player.scrollInventory(true);
}

//for moving between arenas
function clearOldNeighbours(exclude){
	if(leftGrid != undefined && leftGrid != exclude)
		leftGrid.grid = undefined;
	if(rightGrid != undefined && rightGrid != exclude)
		rightGrid.grid = undefined;
	if(topGrid != undefined && topGrid != exclude)
		topGrid.grid = undefined;
	if(bottomGrid != undefined && bottomGrid != exclude)
		bottomGrid.grid = undefined;
	
	leftGrid = undefined;
	rightGrid = undefined;
	topGrid = undefined;
	bottomGrid = undefined;
}

function clearLandscape(){
	//collectables
	for(var i = 0; i < collectables.length; i+= 1){
		gameGrid[collectables[i].x] [collectables[i].y] = 1;
	}
	
	//clear characters
	
	//enemy
	var enMinX = Math.max(enemy.myX + enemy.minX,0);
	var enMaxX = Math.min(enemy.myX + enemy.maxX,numPiecesX - 1);
	var enMinY = Math.max(enemy.myY + enemy.minY,0);
	var enMaxY = Math.min(enemy.myY + enemy.maxY,numPiecesY - 1);
	for(var x = enMinX; x <= enMaxX; x+= 1){
		for(var y = enMinY; y <= enMaxY; y+= 1){
			gameGrid[x][y] = 1;
		}
	}

	collectables = [];	
	numSpecialCols = 0;
	potentialCollectables = [];
	newCollectables = [];

}

//spinning animate to go down portal/stairs 
function goDownStairs(){
	clearLandscape();
	land.grid = null;
	
	//save and load new "allLandscapes" because land down stairs occupies different universe/different complete set of landscapes
	//universe determined by globalSeed while currentSeed determines this landscape so both now also change
	land.allNeighbours = allLandscapes;
	var newLand = activatedStairs.dest;
	if(newLand.allNeighbours != undefined){
		allLandscapes = newLand.allNeighbours;
	}else{
		allLandscapes = [];
	
	}
	
	//will be used to create landscape in start()
	curSeed = newLand.seed;
	globalSeed = newLand.globalSeed;
	allLandscapes[curSeed] = newLand;
	clearOldNeighbours(null);
	start();
	player.emergeFromStairs(land.stairs[activatedStairs.destStairIndex]);
};

//speed up due to boosters also dependent on size of robot
function reportMass(mass,fans,speed){
	message.set("text",fans + " boosters / mass of " + mass + " = speed: " + speed);
	message.set('fill', 'blue');
};



