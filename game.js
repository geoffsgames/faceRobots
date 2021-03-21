var debugMode = false;
var randsSeeded =false; //debugMode;
var scrollingX = 0;
var scrollingY = 0;

Math.seed = Math.round(Math.random() * 1000);
alert(Math.seed);
var startGlobalSeed = Math.seededRandomDouble();
var globalSeed = startGlobalSeed;
var startSeed = Math.seededRandom(1000000,2000000);

var thiefProb = 1; 0.1;
//var handyThiefProb = 0.1;
var handyThiefProb = 0;

var willAddThief = false;
var oldEnemy;

var messageTimer = 0;

var player;
var enemy;

var temp;
var timeStamp = 0;

//changed from "const" due to browser compatibility http://stackoverflow.com/questions/130396/are-there-constants-in-javascript
var maxEnInv = 20;
var minEnInv = 2;
var justResumed = false;

var landscapes = new Array();
var land;

var curSeed = startSeed;
const seedJumpX = 1000;
const seedJumpY = 1;
var leftGrid, rightGrid, topGrid, bottomGrid; //the next grids along
var allLandscapes = [];

var willRestart = false;

var activatedStairs = null;

var willGoDownStairs = false;
var goingDownStairs = false;

var collectables = [];
var newCollectables = [];
var potentialCollectables = [];
var intervalToNextenemy = getEnemyInterval();

var blackWallZindex;

var massScaler = 10;
var massMin = 6;
var massMax = 3;

//Motors
var testingMotors = false;
var testingNoRotateDelay = false;

//PVP
var waitRivalLag = false; //?? - Still used?
var enteringRival = false; //don't respond to any input when entrance of rival animation happening
var inPVP = false;
var rivalCompleted = false; //rival completed a single turn so don't have to wait for
var counter4KeyCmds = 0; //records which iteration we're on so key commands attached to right one
var keyMessage = null; //stores key commands received from rival
var messageSent = false;
var returnedKeyMessage = null;
var waitReturnedKeyMessage = false;
var keyDangerZone = false;
//some had to be copied for keyup events
var keyMessageUp = null; //stores key commands received from rival
var messageSentUp = false;
var returnedKeyMessageUp = null;
var waitReturnedKeyMessageUp = false;
var checkPVP = null;

start();
addPlayer();
oldTime = new Date();
updateGame();
//enemy.extractFromOverlap();

loading = false; //[DON'T CHANGE TO MAKE IT LOAD - go to loadSave.js] so doesn't load at the start of each level

//errorLoop();//- temporary fix for crashes of unknown cause

var animLoop = requestAnimationFrame(renderLoop);

var animating = true;

var updatingPlayer;

var frozeWaitingForEnemy = true;//enemy fade in taking too long - keeps synched so enemy always starts on same frame regardless of delays in animation
var arrivalTime = 0;
var oldTime2 = null;

var socket = null;

var lastKeyCounter = null;

//confusingly - for restarting after death NOT for starting at the beginning
function startWholeGame(){
	changedBlocks = undefined;
	globalSeed = startGlobalSeed;
	leftGrid = undefined;
	rightGrid = undefined;
	topGrid = undefined;
	bottomGrid = undefined;
	allLandscapes = [];
	curSeed = startSeed;
	addPlayer();
	start();
	updateGame();
}

function getEnemyInterval(){
	if(Math.seededRandomDouble() < 0.9)
		return 1;
	else
		return Math.seededRandom(10,20);
	
}

//enter new arena or start game
function start(){
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
	
	
	//willAddThief = true;
	//handyThief = true;
	
}



function drawSpawns(){//for enemies
	for(var i =0 ; i < land.enemyXs.length; i += 1){
		
		var image = new fabric.Image(document.getElementById("spawn"), {
			left: (land.enemyXs[i] + 2) * gridWidth,
			top: (land.enemyYs[i] + 2) * gridHeight,
			width: gridWidth,
			height: gridHeight
		});
		image.selectable = false;
		canvas.add(image);
	};
}

function addStandardPlayerPieces(rob){
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
	
	for(var i =0 ; i < 10; i += 1){
		player.addBlockToInventory("wall");
		
		player.addBlockToInventory("knife");
		player.addBlockToInventory("motor");
		player.addBlockToInventory("spring");

	}
	
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
	
	for(var i =0 ; i < 10; i += 1){
		player.addBlockToInventory("wall");
		
		player.addBlockToInventory("knife");
		player.addBlockToInventory("motor");
		player.addBlockToInventory("spring");

	}
	
	player.group.bringToFront();
}

//for start of game
function scrollToPlayer(){
	
	window.scrollTo(Math.round(Math.max(canvas._offset.left,(player.myX * gridWidth) - (clientWidth / 2))), 
			Math.round(Math.max(canvas._offset.top,(player.myY * gridHeight) - (clientHeight / 2))));
	
	player.scrollInventory(true);

}

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
			gameGrid[x][y].clearAway();
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
	//add it to display and to grid
	var owner = canvas;
	if(blocktype == "obstacle")//scenery not collectable = draw to background
		owner = context;
	addGridSquare(x, y, blocktype, gameGrid, owner, null, 0 , 0,pointX,pointY);
}

function addGridSquare(x, y, blocktype, grid, ownerImage, owner, offsetX, offsetY,pointX,pointY) {	
	if(blocktype == "knife")
		grid[x][y] = new Knife(blocktype, grid, ownerImage, owner, x, y, offsetX, offsetY,pointX,pointY);
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
	
	console.log("keyzone " + counter4KeyCmds);
	if(lastKeyCounter != null && counter4KeyCmds - lastKeyCounter > 1)
		alert("keycounter error: " + (counter4KeyCmds - lastKeyCounter))
	lastKeyCounter = counter4KeyCmds;
	
	keyDangerZone = true;
	//keyCodes during PVP = rival's key codes
	if(keyMessage != null){
		console.log("doing his: " + keyMessage + " TIME " + counter4KeyCmds);
		console.log(keyMessage)
		if(keyMessage.time <= counter4KeyCmds){ //if he sent it at n we know he won't do it until n + 1
			changeStateEnemy(keyMessage.key,keyMessage.dc);
			keyMessage = null
		}
	}
	if(savedKeyPress.key != null){
		console.log("doing mine: SAV " + savedKeyPress + " RET " + returnedKeyMessage + " TIME " + counter4KeyCmds);
		console.log(savedKeyPress)
		console.log(counter4KeyCmds)
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
	console.trace();
	if(oldTime2 != null){
		actualIntv = new Date() - oldTime2; //shouldn't happen as updateGame() in display should handle the delays completely - this is just a failsafe, with appropriate error message
		if((interval * 0.7) > actualIntv){
			console.error("something went wrong with timing");
			waitForTimeout(interval - actualIntv);
			return(-1);
		}
	}
	oldTime2 = new Date();
	if(inPVP){
		counter4KeyCmds ++;
		console.log("incremented to " + counter4KeyCmds);
		message.set("fill", "yellow");
		message.set("text", "" + counter4KeyCmds);
	}
	//TESTING - just for testing lag
	if(willLag){
		time = new Date;
		while(new Date - time < 1000){
		}
	}
	//END TESTING
	
	
	
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
		if(messageTimer == 0 && message.text == "Thiefbot has appeared!")
			message.set("text","");
		
		oldInterval = interval;
		frozeWaitingForEnemy = false;//enemy fade in taking too long;
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
			alert("You have lost!"); //(haven't implemented restart yet - hit refresh)");
			canvas.clear();
			startWholeGame();
		}
		else{
			if(!reallyWaitingForRotate){
				if(inPVP && player.isInvader){ //switch order of player and enemy in PVP to ensure it's the same on both machines
				   	enemy.checkIntermediate();
					if(!justResumed) //if just stopped the motors I've effectively already checked intermediate so rechecking could create clash (Check??? Old code commented late)
						player.checkIntermediate();
				}
				else{
					player.checkIntermediate();
					if(!justResumed && enemy.readyToMove) //if just stopped the motors I've effectively already checked intermediate (Check??? Old code commented late)
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

			
			
			justResumed = false;
			if(inPVP && player.isInvader){ //switch order of player and enemy in PVP to ensure it's the same on both machines
				enemy.tryToChangeDir();
				player.tryToChangeDir();
			}
			else{
				player.tryToChangeDir();
				if(inPVP) //not a rival in two player mode
					enemy.tryToChangeDir();
				else
					enemy.intelligence();
			}
			if(inPVP && player.isInvader){ //switch order of player and enemy in PVP to ensure it's the same on both machines
				enemy.tryToSpeedUp();
				player.tryToSpeedUp();
			}
			else{
				player.tryToSpeedUp();
				enemy.tryToSpeedUp();
			}
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
	//countBlocks();
}

function countBlocks(){
	tot = 0
	for(var x = 0; x < gameGrid.length; x += 1){
		for(var y = 0; y < gameGrid[0].length; y += 1){
			if(gameGrid[x][y] != undefined && gameGrid[x][y] != 1)
				tot += 1;
		}
	}
	return(tot);
}
	
function addThief(){
	//Math.seed = 1000;
	
	console.log("adding thief");
	oldEnemy = enemy;
	var side =0; //left up right down
	var tooFar = true;
	var startX = 0;
	var startY = 0;
	var dir = 0;
	var attempts = 100;
	var i =0;
	var movX = 0;
	var movY = 0;
	while(tooFar && i < attempts){
		movX = 0;
		movY = 0;
		side = Math.round(Math.maybeSeededRandom(0, 3));
		i += 1;
		
		//when creating thief knife at top
		if(side == 0){//left
			//face right
			movX = 1;
			dir = 1;
			startX = 0;
			startY = Math.round(Math.maybeSeededRandom(1,numPiecesY - 5));
		}else if(side == 1){//top
			movY = 1;
			dir = 2;
			startX = Math.round(Math.maybeSeededRandom(1,numPiecesX - 5));
			startY = 0;
		}else if(side == 2){//right
			movX = -1;
			dir = 3;
			startX = numPiecesX;
			startY = Math.round(Math.maybeSeededRandom(1,numPiecesY - 5));
		}else{//down
			movY = -1;
			dir = 0;
			startX = Math.round(Math.maybeSeededRandom(1,numPiecesX - 5));
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
	
	var thiefLand = null;
	if(movX == 1){
		leftGrid = generateNextGrid(leftGrid, -seedJumpX)
		thiefLand = leftGrid;
		adjacentY = newXYForNeighbour(leftGrid,thiefY,width,gameGrid[0].length,leftGrid.grid[0].length,leftGrid.grid.length, true, "right");
		adjacentX = numPiecesX;
	}
	else if(movX == -1){
		rightGrid = generateNextGrid(rightGrid, seedJumpX)
		thiefLand = rightGrid;	
		adjacentY = newXYForNeighbour(rightGrid,thiefY,width,gameGrid[0].length,rightGrid.grid[0].length, rightGrid.grid.length,true,"left");
		adjacentX = 0;			
	}
	else if(movY == 1){
		topGrid = generateNextGrid(topGrid, -seedJumpY)
		thiefLand = topGrid;
		adjacentX = newXYForNeighbour(topGrid,thiefX,width,gameGrid.length,topGrid.grid.length, topGrid.grid[0].length,true,"bottom");
		adjacentY = numPiecesY;
	}
	else if(movY == -1){
		bottomGrid = generateNextGrid(bottomGrid, seedJumpY)
		thiefLand = bottomGrid;
		adjacentX = newXYForNeighbour(bottomGrid,thiefX,width,gameGrid.length,bottomGrid.grid.length, bottomGrid.grid[0].length,true,"top");
		adjacentY = 0;

	}
	thiefChanged = thiefLand.changedBlocks;
	
	var allClear = false;
	var step = 0;
	while(!allClear){
		
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
}


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
	var which = 0; //Math.floor(Math.maybeSeededRandom(0,land.enemyXs.length));
	
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


	/**	
		enemy.addPiece(0,0,"wall");
		enemy.addPiece(1,0,"wall");
		enemy.addPiece(2,0,"wall");
		enemy.addPiece(0,1,"wall");
		enemy.addPiece(1,1,"heart");
		enemy.addPiece(2,1,"wall");
		enemy.addPiece(3,1,"wall");
		enemy.addPiece(4,1,"wall");
		enemy.addPiece(4,2,"motor");
		enemy.addPiece(4,3,"wall");
		enemy.addPiece(3,3,"knife");
		enemy.addPiece(0,2,"knife");
		enemy.totalNumBlocks = 12;
		*/

	}else{
		enemy = new Enemy();
		enemy.loadFromText(enemyStr);
		enemy.AIcountDown = enemyInt;
	
	}
	
	enemy.heart.image.bringToFront();
	enemy.extractFromOverlap();
	enemy.recreateGroup(0,0);
	enemy.setupWeapons();
	
	if(enemy.movX == 0 && enemy.movY == 0){
		enemy.fadeIn();
	}else{
	
		enemy.readyToMove = true;
	};
	enemy.group.bringToFront();
	
}

function addCollectables(){
	//newCollectables contain the collectables that have landed but not been added to the grid. Add them now
	while(newCollectables.length > 0){
		var col = newCollectables[newCollectables.length - 1];

		//remove each from the set of collectables currently flying through the air
		var foundPotential = false;
		for(var i =0; i < potentialCollectables.length && !foundPotential; i+= 1){
			if(potentialCollectables[i][0] == col[0] && potentialCollectables[i][1] == col[1]){
				foundPotential = true;
				potentialCollectables.splice(i,1);
			}
		}
		
		//add each to the grid
		if(gameGrid[col[0]][col[1]] == 1){
			collectables.push(col);
			addRandomDirScenery(col[0], col[1], col[2]);
			gameGrid[col[0]][col[1]].collectable = true;
		}
		newCollectables.pop();
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

function randomFromRange(min, max){
	alert("ERROR: game.js line 406 should not happen!");
}

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
		gameGrid[collectables[i][0]] [collectables[i][1]] = 1;
	}
	
	//enemy
	for(var x = enemy.myX + enemy.minX; x <= enemy.myX + enemy.maxX; x+= 1){
		for(var y = enemy.myY + enemy.minY; y <= enemy.myY + enemy.maxY; y+= 1){
			gameGrid[x][y] = 1;
		}
	}
	collectables = [];	
	potentialCollectables = [];
	newCollectables = [];

}

//for on the fly (non seeded) randoms
function randomFromRange(start, end){
	alert("arrgh");
}

function goDownStairs(){
	clearLandscape();
	canvas.clear();
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

function reportMass(mass,fans,speed){
	message.set("text",fans + " boosters / mass of " + mass + " = speed: " + speed);
	message.set('fill', 'blue');
};



