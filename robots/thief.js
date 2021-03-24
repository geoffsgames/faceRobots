var smallThiefProb = 0; //0.5;
var noFanProb = 0.1;
var threeFanProb = 0.1;

var handyThief = false;

Thief.prototype = new Enemy();        
Thief.prototype.constructor=Thief;


var thiefTest = true

Thief.prototype.getOtherRobot = function() {
	return player;
};

function Thief(myX, myY, facing) {
	this.setup(myX, myY, facing);
}

Thief.prototype.setup = function(myX, myY, facing){
	Enemy.prototype.setup.call(this,myX, myY, facing);
	this.isThief = true;
	this.mainFace = "thiefFace";
	this.startFace = this.mainFace;
	this.makeGrid();

	//A.I. Variables
	this.preferenceForSpecials = Math.seededRandom(1, 5);
	this.preferenceForKnives = Math.min(1,this.preferenceForSpecials - 1);
	this.missProb = Math.seededRandom(4,15);//probability of missing a collectable when iterating through them
	this.faceAlertness = 1; //0.9
	this.chaseProb = Math.seededRandomDouble(0, 0.3);
	this.stepSideProbabilityRun = 0.1; //much lower probability of stepping aside - will probably run instead
	this.stepSideProbabilityBlockedDecr = 0.1;//every time I'm blocked increase probability of back stepping next time
	this.stepSideProbabilityBlockedOrig = 0.5;//lower = more likely to back step
	this.stepSideProbabilityBlocked = this.stepSideProbabilityBlockedOrig;//current value
	this.awarenessDis = Math.seededRandom(2, 5);
	
	this.goingHome = false;
	this.readyToMove = true;
	this.startX = myX;
	this.startY = myY;
	this.isThief = true;
	this.goingHome = false;
	this.goingHomeToStart = false;
	this.lostAKnife = false;
	this.AIcountDown = 0;
	this.hasEnteredFully = false;
	
	this.passageCleared = false;
};

Thief.prototype.die = function(){
	console.log("thief died");
	enemy = oldEnemy;
	this.isHurt = false;
	Person.prototype.die.call(this);
	this.readyToMove = false;
	intervalToNextEnemy = getEnemyInterval();
	console.log(intervalToNextEnemy);
	oldEnemy.animateFadeOut();
	player.faster = true;
	player.willResetInterval = true;

};


Thief.prototype.setToFacing = function(){
	//doesn't recalculate target center, 
	//doesn't recalculate desired direction as thief should ALWAYS be facing direction moving because of fans 
	//TODO same should apply to other enemies with fans
	
	Enemy.prototype.setToFacing.call(this, this.target.myX, this.target.myY, this.movX, this.movY); 
	

};

Thief.prototype.leaveGrid = function(){
	if(this.passageCleared)
		return;
		
	if(this.movX != 0)
		this.width = this.maxY - this.minY;
	else if(this.movY != 0)
		this.width = this.maxX - this.minX;
	clearThiefsPassage(-this.movX, -this.movY,this.myX + this.minX,this.myY + this.minY, this.width, this.minX, this.minY);
	this.passageCleared = true;
};

Thief.prototype.checkEnteredFully = function(){
	if(this.hasEnteredFully)//never retest - once it's in it's in
		return true;
	
	if(this.jumpedBack)
		return false;
	if(this.myX <= 0)
		return false;
	else if(this.myX + this.maxX >= numPiecesX)
		return false;
	else if(this.myY <= 0)
		return false;
	else if(this.myX + this.maxX >= numPiecesX) 
		return false;
	
	this.hasEnteredFully = true;
	return true;
};

Thief.prototype.intelligence = function(){
	if(intermediate || this.partsMoving || !this.readyToMove || !this.checkEnteredFully())
		return;
	if(this.blockedByLandscape){
		var blocked = this.respondToBlockedByLandscape();
		
	}
	if(blocked || this.AIcountDown < 0){
	//		this.movX = -this.movX;
	//		this.movY = -this.movY;
	//		this.AIcountDown = 5;
	//		this.changedDir = true;
			
			var oldMovX = this.movX;
			var oldMovY = this.movY;
			
			//respond to collectables
			this.pickDirection();
			//respond to player
			var disToPlayer = this.reactToPlayer();
			if(disToPlayer == -1) //not responding to player
				this.AIcountDown = this.disToTarget * (this.alertness / (Math.seededRandomDouble(2, 4)));
			else
				this.AIcountDown = disToPlayer;
			
			
			if(this.movX != oldMovX || this.movY != oldMovY){
				if(Math.seededRandomDouble() < this.faceAlertness)
					this.setToFacing();
				this.changedDir = true;
			}
	}
};


Thief.prototype.collectAll = function(){
	for(var i =0; i < this.collecting.length; i += 1){
		var block = this.collecting[i];
		var x = block.myX;
		var y = block.myY;
		for(var c = 0; c < collectables.length; c += 1){
			if(collectables[c][0] == x && collectables[c][1] == y)
				collectables.splice(c,1);
		}
	}
	this.target = null;
	this.AIcountDown = -1;
	this.collecting = [];
};

Thief.prototype.pickDirection = function(){
	//if I'm chasing him he may well run away altogether - thieves are generally cowards
	var centerX = this.myX + this.minX + ((this.maxX - this.minX) / 2);
	var centerY = this.myY + this.minY + ((this.maxY - this.minY) / 2);
	if(this.goingHome && !this.goingHomeToStart && this.lostAKnife){//if I've lost a knife I can't punch through walls
																	//so override going home
		var dis = Math.abs(this.target.centerX - centerX) + Math.abs(this.target.centerY - centerY);
		var prob = Math.min(1,(30 - dis) / 30);
		if(Math.seededRandomDouble() < prob){
			this.target = new Target(this.startX, this.startY, 1,1);
			this.goingHomeToStart = true;
		}
	}
	if(this.target == null){
		var minDis = 100;
		var minCollect = null;
		if(collectables.length == 0){//go home

			
			//find the nearest side and head there
			var disRight = numPiecesX - (this.myX + this.maxX);
			var disLeft = this.myX + this.minX;
			var disBottom = numPiecesY - (this.myY + this.maxY);
			var disTop = this.myY + this.minY;
			if(Math.min(disTop,disBottom) < Math.min(disLeft,disRight)){
				if(disTop < disBottom)
					this.target = new Target(this.myX + (this.gridSize / 2), -this.gridSize, 1,1);
				else
					this.target = new Target(this.myX + (this.gridSize / 2), numPiecesY, 1,1);
			}else{
				if(disLeft < disRight)
					this.target = new Target(-this.gridSize, this.myY + (this.gridSize / 2), 1,1);
				else
					this.target = new Target(numPiecesX, this.myY + (this.gridSize / 2), 1,1);

			}
			
			this.goingHome = true;
		}
		else{
				for(var i =0; i < collectables.length; i += 1){
					var colX = collectables[i][0];
					var colY = collectables[i][1];
					if(colX < numPiecesX && colX >= 0 && colY < numPiecesY && colY >= 0){
						var col = gameGrid[colX][colY];
						//if(Math.seededRandomDouble() > (1/this.missProb)){
							var dis = Math.abs(colX - centerX) + Math.abs(colY - centerY);
							if(col.special)
								dis = dis / this.preferenceForSpecials;
							else if(col.type == "knife")
								dis = dis / this.preferenceForKnives;

							if(dis < minDis){
								minDis = dis;
								minCollect = col;
							}
						//}
					}
				}
				
				this.collectMinDis = minDis;
				this.target = minCollect;
				this.target.centerX = minCollect.myX;
				this.target.centerY = minCollect.myY;
		}
	}
	//probGoingHome increases after each block
	//	a few have fans on side to correct this
	//	sometimes fails at attempt to get out
	//	grabbing hand on the front but not always

};




Thief.prototype.makeGrid = function(){
	this.width = 1;
	if(Math.seededRandomDouble() < smallThiefProb){
		var addFan = Math.seededRandomDouble() > noFanProb;
		
		var trunkLength = Math.seededRandom(1, 3);
		var totalLength = trunkLength + 1;
		if(addFan)
			totalLength += 1;
		var centerX = Math.floor(totalLength / 2);
		
		this.addPiece(centerX,0,"knife");
		this.totalNumBlocks = trunkLength + 1;
		var facePos = Math.seededRandom(1, trunkLength);
		for(var i = 0; i < trunkLength; i+= 1){
			if(i + 1 == facePos)
				this.addPiece(centerX,i + 1,"heart");
			else
				this.addPiece(centerX,i + 1,"wall");
		}
		if(addFan){
			this.addPiece(centerX,trunkLength + 1,"fan");
			this.totalNumBlocks += 1;
		}
	}
	else{//bigger robot
		//2, 3 or 4 fans have equal probability. 1 has a lower probability
		var numFans = 0;
		if(Math.seededRandomDouble() < noFanProb)
			numFans = 1;
		else if(Math.seededRandomDouble() < threeFanProb)
			numFans = 3;
		else
			numFans = 2;
		
		if(numFans == 3)
			width = Math.seededRandom(3, 4);
		else
			width = Math.seededRandom(2, 4);
		
		for(var x =0; x < width; x+= 1)
			this.addPiece(x,0,"knife");
		for(var x =0; x < width; x+= 1)
			this.addPiece(x,1,"wall");
		for(var x = 0; x < width; x+= 1){
			if(x == 1)
				this.addPiece(x,2,"heart");
			else
				this.addPiece(x,2,"wall");
		}
		for(var x =0; x < width; x+= 1)
			this.addPiece(x,3,"wall");
		for(var x =0; x < numFans; x+= 1)
			this.addPiece(x,4,"fan");
		this.totalNumBlocks = width * 4 + numFans;
		this.width = width;
	}
	this.findWeapons();
};

Thief.prototype.lostKnife = function(block){
	this.lostAKnife = true; //so can't get out through punching a new hole
};

Thief.prototype.setRunningFace = function(running){
	if(running)
		this.resetFace("thieffaceScared");
	else
		this.resetFace(this.mainFace);

};

Thief.prototype.resetFace = function(url){
	if(url != "thieffaceScared" && url != this.mainFace)
		return;
	//so doesn't set enemy face
};
