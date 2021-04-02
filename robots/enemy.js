"use strict";
var fadeDuration = 2000; //fading in body
var fadeDuration2 = 200; //fading in face after body faded in
var fadeFrames = (fadeDuration + fadeDuration2) / interval; //number of game frames takes to fade in
//reset the difficulty
var difficulty = 0;
slider.value = difficulty;


Enemy.prototype = new Person();        
Enemy.prototype.constructor=Enemy;

var testingMovement = false;
    
Enemy.prototype.getOtherRobot = function() {
	return player;
};

function Enemy(myX, myY, facing) {
	this.setup(myX,myY,facing);
}

Enemy.prototype.setup = function(myX, myY, facing) {
	this.isThief = false;
	
	this.isEnemy = true;
	if(myX != undefined)
		Person.prototype.setup.call(this,myX, myY, facing);
	this.deadFace = "badfaceDead";
	this.mainFace = "badface";
	this.startFace = "badfaceIgnore";
	this.directionFaces = ["badfaceRight", "badfaceDown", "badfaceLeft", "badfaceUp"];
	this.hurtFace = "badfaceHurt";
	//AI/////////////////////////////////////////////
	this.AIcountDown =  0;
	this.countdownDecr = 1;
	this.willLeaveGrid = false;
	this.stopRunningProb = 0.1;
	this.noLuckCounter = 0;
	this.willRotateNext = 0;

	this.tempCount = 0;
	
	//TODO - currently hard coded but will ultimately depend on different robots having different personalities (bravery and stupidity). 
	//Genetic Algorithms/Fuzzy logic may also play a part in finding the best balance
	
	//blocked = if I keep going way I'm going I'll collide with player with neither of us getting injured
	//default response = side step
	//alternative response = back step
	//these variables help us choose between the two
	//also the closer I am the more likely I am to back step
	
	//run = if I keep going way I'm going I'll INJURE MYSELF on player
	//probably of stepping side (as opposed to back) obviously lower
	
	
	//amIStuck
	
	this.pos = []
	this.stuckScore = 0
	this.rotationStuck = 0;
	
	//*************AI PARAMETERS = ROBOTS PERSONALITY***********//
	this.stepSideProbabilityRun = Math.seededRandomDouble(0.2, 0.7); //higher = scared. More likely to run rather than sidestep
	this.motorProb = 0.75;
	this.stepSideProbabilityBlockedDecr = Math.seededRandomDouble(0.1, 0.2);//every time I'm blocked increase probability of back stepping next time
	this.stepSideProbabilityBlockedOrig = Math.seededRandomDouble(0.5, 1);//lower = more likely to back step
	this.chaseProb = Math.seededRandomDouble(0.9, 1);
	this.awarenessDis = Math.seededRandom(10, 20); //how close I have to be to enemy for him to know about me
	//FOR LANDSCAPE
	this.retreatingProb = 0.1;
	this.origRetreatingProb = 0.1;
	this.alertness = Math.seededRandomDouble(1, 3);//determines how big intervals between making a decision are

	
	//***************End of AI Parameters********************//
	
	
	this.stepSideProbabilityBlocked = this.stepSideProbabilityBlockedOrig;//current value

	this.retreatingFromLandscapeX = -1;
	
	this.dontStartMotors = false;
	
	this.readyToMove = false;
	this.contactX = null;

	this.justReadyToMove = false;
};

Enemy.prototype.isWeapon = function(block){
	return block.isWeapon;
}


Enemy.prototype.die = function(){
	for(var i =0, len = this.motors.length; i < len; i+= 1){
		if(this.motors[i] != null && (this.motors[i].movX != 0 || this.motors[i].movY != 0))
			this.motors[i].stop();
	}
	
	player.faster = true;
	player.willResetInterval = true;
	
	this.isHurt = false;
	this.running = false;	
	Person.prototype.die.call(this);
	this.readyToMove = false;
	//land.enemiesLeft -= 1;
	//if(land.enemiesLeft > 0)
	if(player.hasWeaponInInventory() && Math.maybeSeededRandom(0,1) < handyThiefProb){
		willAddThief = true;
		handyThief = true;
	}
	else if(collectables.length > 0 && Math.maybeSeededRandom(0,1) < Math.min(0.8,(collectables.length * thiefProb))){
		willAddThief = true;
		handyThief = false;
	}
	else{
		intervalToNextEnemy = getEnemyInterval();
		this.animateFadeOut();
	}
};

Enemy.prototype.collectAll = function(){
	Person.prototype.collectAll.call(this);
	this.findWeapons();
};

Enemy.prototype.animateFadeOut = function(){
	this.heart.image.animate('opacity', 0, {
        onComplete: function(){
        	willAddEnemy = true;
        },
        duration: intervalToNextEnemy * initialInterval
	});
};

Enemy.prototype.lostKnife = function(block){
	this.weapons.delete(this);
	//no knifes enemy will always run	
	if(this.weapons.size == 0){
		this.permanentlyRunning = true;
	}
};


Enemy.prototype.update = function(){
	//canvas.renderAll();
	if(this.leftGrid()){
		this.leaveGrid();
		if(intermediate)
			this.willLeaveGrid = true;
		else{
			this.hasLeftGrid = true;
			this.die();
		}
	}
	if(willRestart != null)
		this.die();
	if(this.readyToMove && (!debugMode || timeStamp >= (fadeFrames - arrivalTime))){ //last bit = enemy fade in too quick
		if(!intermediate){
			this.AIcountDown -= this.countdownDecr;
			if(this.countDownDecr < 1){
				this.countDownDecr += Math.maybeSeededRandom(0,0.1)
				if(this.countDownDecr > 0.9 && this.weapons.length > 0)
					this.permanentlyRunning = false;
				if(this.countDownDecr > 1){
					this.countDownDecr = 1;
					this.blinder.loseEffect();
					this.blinder = null;
					this.permanentlyRunning = false;
					this.resetFace("badface");
				}
			}
		}
		Person.prototype.update.call(this);
		if(this.notReadyToMove){
			this.justReadyToMove = true;
			this.notReadyToMove = false;
		}
	}
	else{
		this.notReadyToMove = true;
		this.moved = false;
		allComplete();
	}
};

Enemy.prototype.leaveGrid = function(){
	
};

Enemy.prototype.leftGrid = function(){
	
	if(this.willLeaveGrid)
		return true;
	if(this.myX + this.minX == numPiecesX-1 && this.movX == 1){ //heading out right
		return true;
	}
	else if(this.myX + this.maxX == 0 && this.movX == -1){ //left 
		return true;
	}
	else if(this.myY + this.minY == numPiecesY-1 && this.movY == 1){ //heading out bottom
		return true;
	}
	else if(this.myY + this.maxY == 0 && this.movY == -1){ //top 
		return true;
	}
	return false;
};

Enemy.prototype.checkMotors = function(mot){

	
	if(!mot.isWorking())
		return false;
	
	var motX = mot.weapon.myX + this.myX;
	var motY = mot.weapon.myY + this.myY;
	
	var dis = 0;
	var movX = 0;
	var movY = 0;
	var startProb = 0;
	
	//horizontal movement
	if(motX < player.myX + player.minX){
		dis = (player.myX + player.minX) - motX;
		movX = 1;
	}
	else if(motX > player.myX + player.maxX){
		dis = motX - (player.myX + player.maxX);
		movX = -1;
	}
	if(mot.oldMovX == movX != 0 && motY > player.myY + player.minY && motY < player.myY + player.maxY){
		startProb = this.motorProb * (mot.getDis() / dis);
	}
	
	if(startProb == 0){
		//horizontal movement
		if(motY < player.myY + player.minY){
			dis =  (player.myY + player.minY) - motY;
			movY = 1;
		}
		else if(motY > player.myY + player.maxY){
			dis = motY - (player.myY + player.maxY);
			movY = -1;
		}
		if(mot.oldMovY == movY != 0 && motX > player.myX + player.minX && motX < player.myX + player.maxX){
			startProb = this.motorProb * (mot.getDis() / dis);
		}
	}
	
	console.log(startProb);
	return Math.maybeSeededRandom(0,1) < startProb

};

Enemy.prototype.respondToBlockedByLandscape = function(){
	if(Math.maybeSeededRandom(0,1) < this.retreatingProb){ //low probability will respond to being blocked by landscape by backing off rather than sliding down it
		
		//the "X" after retreatingFromLandscapeX refers to direction of movement, the Y in this.myY is the point I hit at, hence why they are different
		
		if(this.movX != 0){ //moving horizontal, 
							//for now I reverse horizontal but I will at some point start moving vertical again to get round obstacle, 
							//this var guides the probability with which I do that
			this.retreatingFromLandscapeX = this.myY;
		
		}else
			this.retreatingFromLandscapeY = this.myX;
		
		return true;
	}
		

	
	
	//if blocked by obstacle will move to side 
	if(this.movX != 0){//heaving left or right
		var overlapTop = false, yTop;
		var overlapBottom = false, yBottom;
		var xFront = this.myX + this.maxX;
		if(this.movX == -1)
			xFront = this.myX + this.minX;
		
		for(let area of land.areasAndNoise){

			//check ahead - if that still leads to collision choose alternative sideways direction
			yTop = this.minY + this.myY - 1;
			yBottom = this.maxY + this.myY + 1;
			
			if(xFront >= area.minX && xFront < area.maxX){
				if(yTop >= area.minY && yTop < area.maxY)
					overlapTop = true;
				else if(yBottom >= area.minY && yBottom < area.maxY)
					overlapBottom = true;
			}

		}
		if(overlapTop && overlapBottom)
			this.movX = -this.movX;
		else if(overlapTop){
			this.movY = 1;
			this.movX = 0;
		}
		else if(overlapBottom){
			this.movY = -1;
			this.movX = 0;
		}
		else{
			this.movX = 0;
			this.movY = (Math.round(Math.maybeSeededRandom(0,1)) * 2) - 1;
		}
			

	}else{
		var overlapLeft = false, xLeft;
		var overlapRight = false, xRight;
		var yFront = this.myY + this.maxY;
		if(this.movY == -1)
			yFront = this.myY + this.minY;
		
		for(let area of land.areasAndNoise){

			//check ahead - if that still leads to collision choose alternative sideways direction
			xLeft = this.minX + this.myX - 1;
			xRight = this.maxX + this.myX + 1;
			
			if(yFront >= area.minY && yFront < area.maxY){
				if(xLeft >= area.minX && xLeft < area.maxX)
					overlapLeft = true;
				else if(xRight >= area.minX && xRight < area.maxX)
					overlapRight = true;
			}

		}
		if(overlapLeft && overlapRight)
			this.movY = -this.movY;
		else if(overlapLeft){
			this.movX = 1;
			this.movY = 0;
		}
		else if(overlapRight){
			this.movX = -1;
			this.movY = 0;
		}
		else{
			this.movY = 0;
			this.movX = (Math.round(Math.maybeSeededRandom(0,1)) * 2) - 1;
		}

	}
	this.retreatingProb = this.retreatingProb * 2;
	this.AIcountDown = this.AIcountDown / 2; //lost direction so will try to figure out where I'm meant to go sooner
	return false;
}

Enemy.prototype.amIStuck = function(){
	var limit = 10;

	for(var i =limit - 1; i > 0; i-= 1){
		if(this.pos[i - 1] == undefined)
			this.pos[i - 1] = [];
		this.pos[i] = this.pos[i - 1]
	}
	
	this.pos[0] = [this.myX,this.myY,this.facing];
	
	//if I've been in the same place multiple times before
	for(var i =1; i < 5; i+= 1){
		if(this.pos[0][0] == this.pos[i][0] && this.pos[0][1] == this.pos[i][1] && this.pos[0][2] == this.pos[i][2] )
			this.stuckScore += (limit - i);
	}

}

Enemy.prototype.intelligence = function(){
	
	//if(!this.isThief) 
		//return;
	
	if(intermediate || this.partsMoving || !this.readyToMove || this.movepartsSpeed > 1)
		return;
	
	if(this.willRotateNext != 0){
		this.rotation = this.willRotateNext;
		this.rotateAndExtract();
		this.willRotateNext = 0;
		return;
	}
	
	if(testingMovement){
		//just going back and forth - for testing
		if(this.movX == 0 && this.movY == 0){
				this.movY = -1;
				this.changedDir = true;

		}
		if(this.blockedByLandscape){
				this.movX = -this.movX;
				this.movY = -this.movY;
				this.changedDir = true;
		}
		/**
		if(this.tempCount % 5 == 0){
			if(this.tempCount % 10 == 0){
				this.rotation = 1;
				this.willRotateNext = 1;
			}
			else{
				this.rotation = -1;
				this.willRotateNext = -1;
			}
			this.rotateAndExtract();
		}
		else if(this.tempCount % 2 == 0){		
			this.motorWillStart = 0;
		}
		message.setText("" + this.tempCount);
	*/
		if(this.tempCount == 1){
			this.rotation = 1;
			this.rotateAndExtract();
		}

		this.tempCount += 1;
	}
	else{
	
		if(this.scrambleCounter == 0){
			this.guessScrambledCode(code);
			return;
		}
		else if(this.scrambleCounter != undefined){
			this.scrambleCounter --;
		}

		
		this.amIStuck(); //been moving through the same 2,3 nearby locations over and over again or otherwise stuck
		if(this.stuckScore > 0)
			this.stuckScore -= 1;
		
		var oldMovX = this.movX;
		var oldMovY = this.movY;
		
		var readyToPickDirection = true; //only false if sliding along to get away from obstacle, 
										//otherwise can potentially turn to head towards a target
		if(this.blockedByLandscape){
			var readyToPickDirection = this.respondToBlockedByLandscape();
			
		}
		if(readyToPickDirection){		
				if(this.AIcountDown < 0){
						var dis = this.pickDirection();
						if(dis != -1){ //dis is from player. dis == -1 is code for not currently chasing player. 
							if(dis <= 1)
								this.AIcountDown = 0;
							else
								this.AIcountDown = (Math.maybeSeededRandom(0,1) * dis) * this.alertness;
						}
					};
					//TODO based on how far I am away may choose to ignore player and go after collectables
		};
		
		
		//difficulty - difficulty higher than 0 means potentially keep the old direction
		if(Math.maybeSeededRandom(0,1) < difficulty){
			this.movX = oldMovX;
			this.movY = oldMovY;
		}
		
		this.changedDir = this.movX != oldMovX || this.movY != oldMovY;
		
		
		if((this.changedDir || this.rotation != 0) && this.scrambler != null){
			this.guessScrambledCode();
			this.changedDir = this.movX != oldMovX || this.movY != oldMovY;
		}
		
		if(!this.dontStartMotors){
			if(this.motors[0] != undefined && this.motors[0] != null){
				if(this.motors[0].needsCalc){
					this.setupWeapons();
				}
			}
			for(var i =0, len = this.motors.length; i < len && this.motorWillStart == null; i += 1){
				if(this.motors[i] != null && this.checkMotors(this.motors[i]))
					this.motorWillStart = i;
				
			};
		}
		this.dontStartMotors = false;
	}

};

//does most of the work
Enemy.prototype.pickDirection = function(){
	var dis = -1;
	if(land.areas.length > 1){//some landscapes have multiple areas
		//target = adjacent area or player if its in the same area
		if(this.targetArea == undefined){//at the start so no target area yet
			//aim for one of my bordering areas (randomly chosen)
			this.targetArea = this.area.neighbours[Math.floor(Math.maybeSeededRandom(0,this.area.neighbours.length))];
			this.target = new Target(this.targetArea.left, this.targetArea.top, this.targetArea.width, this.targetArea.height);
			this.follow();//aim at target
		}
		else if((this.target != player) //not chasing player
			&&			//and we've moved to next area (target area) then choose new area to target
		(this.myX + this.maxX > this.targetArea.left && this.myX + this.minX < this.targetArea.left + this.targetArea.width
				&& this.myY + this.maxY > this.targetArea.top && this.myY + this.minY < this.targetArea.top + this.targetArea.height)
			||
		(this.targetArea == this.area && Math.abs(this.myX + (this.gridSize / 2)) - this.target.centerX < 5&&
		Math.abs(this.myY + (this.gridSize / 2)) - this.target.centerY < 5)//also re-target if I've just reached center of dead end area
		){
			
			var neighbours = this.targetArea.neighbours;
			if(this.area == this.targetArea)
				this.area = null;
			var otherNeighbours = [];
			for(var i =0; i < neighbours.length; i += 1){
				if(neighbours[i] != this.area)
					otherNeighbours.push(neighbours[i]);
			}
			this.area = this.targetArea;
			if(otherNeighbours.length > 0){ //if not entering dead end then choose new area to target
				this.targetArea = otherNeighbours[Math.floor(Math.maybeSeededRandom(0,otherNeighbours.length))];
				this.target = new Target(this.targetArea.left, this.targetArea.top, this.targetArea.width, this.targetArea.height);
			}
			//if I AM entering a dead end then I'll end up just heading to the center
			this.follow();
		};
		
		//if we're still in the same area do nothing - just keep current target
	}
	if(land.areas.length == 1 || playerIn(this.area)){//chasing player
		
		//turn towards player with strongest weapons
		this.setToFacing();
		
		
		//just graphics - show angry face because I'm chasing
		if(this.target != player){
			this.target = player;
		}
		dis = this.reactToPlayer();
	};
	this.retreatingProb = this.origRetreatingProb;

	//distance from player for deciding how soon to make a decision again.
	//if I'm closer to player make decision soon as its more urgent obviously
	return dis;
};

Enemy.prototype.reactToPlayer = function(){
	//how far I am from the player affects my behaviour as follows:
	var dis = Math.abs((this.myX + this.minX + ((this.maxX - this.minX)/2)) - 
			(player.myX + player.minX + ((player.maxX - player.minX)/2)))
			
			 + Math.abs((this.myY + this.minY + ((this.maxY - this.minY)/2)) - 
				(player.myY + player.minY + ((player.maxY - player.minY)/2)));
	
	this.playerDis = dis;
	
	var prediction;
	if(!this.running || (Math.maybeSeededRandom(0,1) < this.stopRunningProb && !this.permanentlyRunning)){ //if I'm running away then don't necessarily decide on another action
		prediction = this.predictCollision(player);
		this.running = false;
		this.setRunningFace(false);
		this.stopRunningProb = 0.1;
	}
	else{
		prediction = [dis, "run"];
	}
	
	//TODO lotta hard coded values
	if(prediction != null){
		dis = prediction[0];
		
		if(prediction[1] == "run"){
			if(this.stopRunningProb < 0.75)
				this.stopRunningProb += 0.05
			this.running = true;
			this.setRunningFace(true);
			if(Math.maybeSeededRandom(0,1) >  Math.pow((1.0 / Math.max(dis,1.0)), this.stepSideProbabilityRun)) //Math.pow etc. ensures if I'm next to me I'm always going to step back
				this.stepAside();
			else 
				this.stepBack();
			this.stepSideProbabilityBlocked = this.stepSideProbabilityBlockedOrig; 
		}
		else if(prediction[1] == "chase"){
			if(Math.maybeSeededRandom(0,1) <  this.chaseProb){
				this.stepSideProbabilityBlocked = this.stepSideProbabilityBlockedOrig; 
				
				//contactX,Y are the points on me I aim to collide with player, 
					//chaseX,Y are points on me (a weapon) that have been predicted in predictCollision to actually make contact with player
				this.contactX = this.chaseX;
				this.contactY = this.chaseY;
			}
			else{
				prediction[1] = "blocked";
			}
		} 
		if(prediction[1] == "blocked"){
			if(Math.maybeSeededRandom(0,1) > Math.pow((1.0 / Math.max(dis,1.0)), this.stepSideProbabilityBlocked)){//Math.pow etc. ensures if I'm next to me I'm always going to step back
				this.stepAside();							
				this.stepSideProbabilityBlocked -=  this.stepSideProbabilityBlockedDecr; //increase the probability of stepping back next
			}
			else{
				this.stepBack();
				if(this.stepSideProbabilityBlocked < this.stepSideProbabilityBlockedOrig)
					this.stepSideProbabilityBlocked = this.stepSideProbabilityBlockedOrig; 
				else	
					this.stepSideProbabilityBlocked += this.stepSideProbabilityBlockedDecr; //increase the chance of stepping sideways next
			};
		};
	}else{
		this.stepSideProbabilityBlocked = this.stepSideProbabilityBlockedOrig; 

		
		this.follow();
		
		return -1;
	}
	//for deciding how soon to make a decision again
	return dis;
};

Enemy.prototype.stepBack = function(){
	this.movX = -this.movX;
	this.movY = -this.movY;
};

Enemy.prototype.stepAside = function(){
	if(this.movX != 0){
		this.movX = 0;
		this.movY = (Math.round(Math.maybeSeededRandom(0,1)) * 2) - 1;
	}
	else{
		this.movY = 0;
		this.movX = (Math.round(Math.maybeSeededRandom(0,1)) * 2) - 1;

	}
}

Enemy.prototype.respondToDamagedOther = function() {
	Person.prototype.respondToDamage.call(this);
	this.stuckScore -= 20;
};

Enemy.prototype.predictCollision = function(other){
	var collidingSideways = false;
	var collidingOnwards = false;
	
	var disX;
	var disY;
	
	var thismaxX = this.maxX + 1;
	var othermaxX = other.maxX + 1;
	var thismaxY = this.maxY + 1;
	var othermaxY = other.maxY + 1;
	var timeToCollide;
		
	//if we're about to collide at a right angle (not head on) - called "collidingSideways"
	if(((this.movX != 0 && (this.movX > 0 == other.myX > this.myX)) ||   //if I closing in
			(this.movY != 0 && (this.movY > 0 == other.myY > this.myY)))
			&&
		((other.movX != 0 && (other.movX > 0 == this.myX > other.myX)) ||   //if he's closing in
			(other.movY != 0 && (other.movY > 0 == this.myY > other.myY)))
			&&
		((this.movX != 0) != (other.movX != 0))){ //if one of us is going up/down and the other is going left/right
		
			//calculate how long to collision
			var lengthY = (thismaxY - this.minY) + (othermaxY - other.minY); 
			var lengthX = (thismaxX - this.minX) + (othermaxX - other.minX);
			
			if(other.myX > this.myX)
				disX = ((other.myX + other.minX) - (this.myX + thismaxX));
			else
				disX = ((this.myX + this.minX) - (other.myX + othermaxX));
			
			if(other.myY > this.myY)
				disY = ((other.myY + other.minY) - (this.myY + thismaxY));
			else
				disY = ((this.myY + this.minY) - (other.myY + othermaxY));
			
			
			var shorterDisMax;
			var longerDisMin;
			
			if(disX > disY){
				shorterDisMax = disY + lengthY;
				longerDisMin = disX;
			}else{
			
				shorterDisMax = disX + lengthX;
				longerDisMin = disY;
			}
			if(longerDisMin + 1 < shorterDisMax){
				collidingSideways = true;
			}
			
			timeToCollide = longerDisMin + 1;
		}
	
	//head on collision
	if(((this.movY != 0 && (this.movY > 0 == other.myY > this.myY)) && 
			((other.movY == -this.movY) || other.isStopped()) && 
			this.myX + thismaxX >= other.myX + other.minX && this.myX + this.minX <= other.myX + othermaxX)
			||
			((this.movX != 0 && (this.movX > 0 == other.myX > this.myX)) && 
			((other.movX == -this.movX) || other.isStopped()) && 
			this.myY + thismaxY >= other.myY + other.minY && this.myY + this.minY <= other.myY + othermaxY)){
		
		collidingOnwards = true;
		
		disX = 0;
		disY = 0;
		
		if(this.movX != 0){
			if(other.myX > this.myX)
				disX = ((other.myX + other.minX) - (this.myX + thismaxX));
			else
				disX = ((this.myX + this.minX) - (other.myX + othermaxX));
		}
		else{
			if(other.myY > this.myY)
				disY = ((other.myY + other.minY) - (this.myY + thismaxY));
			else
				disY = ((this.myY + this.minY) - (other.myY + othermaxY));
		}
		
		timeToCollide = Math.max(disX,disY) + 1;
		
	}
	
	//currently doesn't know how fast player is going
	timeToCollide = timeToCollide / this.changeDirTrial();
	
	if(timeToCollide > this.awarenessDis)
		return null;
	
	
	//console.log("collidingOnwards= " + collidingOnwards + " collidingSideways= " + collidingSideways);
	
	if(collidingOnwards || collidingSideways){
			
			var willHurtMe = false;
			var willHurtThem = false;
			var blocked = false;
			var collided = false;
			var tryAgain = false;
			var count = 0;
			
			do{
				
				//get position other will be on collision
				var othOffX = other.myX + (timeToCollide * other.movX);
				var othOffY = other.myY + (timeToCollide * other.movY);

				//get position I will on collision
				var meOffX = this.myX + (timeToCollide * this.movX);
				var meOffY = this.myY + (timeToCollide * this.movY);
				
				var minX = Math.max(meOffX + this.minX,othOffX + other.minX);
				var minY = Math.max(meOffY + this.minY,othOffY + other.minY);
				var maxX = Math.min(meOffX + this.maxX,othOffX + other.maxX);
				var maxY = Math.min(meOffY + this.maxY,othOffY + other.maxY);

				
				for(var x = minX; x < maxX; x += 1){
							for(var y = minY; y < maxY; y += 1){

									var mySq = this.grid[x - meOffX][y - meOffY];
									var otherSq = other.grid[x - othOffX][y - othOffY];
									if(otherSq != null){
										collided = true;
										if(mySq != null){
											if(mySq.sideStrength > otherSq.sideStrength){
												willHurtThem = true;
												this.chaseX = x;
												this.chaseY = y;
											}
											else if(mySq.sideStrength < otherSq.sideStrength)
												willHurtMe = true;
											else
												blocked = true;
										}
				
									}
							}
				}
				
				if(collided && !blocked && !willHurtMe && !willHurtThem && count < 5){
					tryAgain = true;
					timeToCollide += 1;
					count += 1;
				}
				else
					tryAgain = false;
			}while(tryAgain);
	}
	
	if(willHurtMe){
		//console.log("run " + timeToCollide);
		if(willHurtThem)
			return [timeToCollide * 2, "run"]; //if he'll hurt me but I'll hurt him anyway then reduce the chance of taking evasive action by pretending the distance is greater
		return [timeToCollide, "run"];
	}
	else if(willHurtThem){
		//console.log("chase " + timeToCollide);
		return [timeToCollide, "chase"];
	}
	else if(blocked){
		//console.log("blocked " + timeToCollide);
		return [timeToCollide, "blocked"];
	}
	else{
		//console.log("null");
		return null;//if it's null then sidestep
	}
	
};

function playerIn(area){
	return (player.myX + player.maxX > area.left && player.myX + player.minX < area.left + area.width
			&& player.myY + player.maxY > area.top && player.myY + player.minY < area.top + area.height);

}

var Target = function(left, top, width, height){
	this.centerX = left + ((left + width) * Math.maybeSeededRandom(0.3,0.7));
	this.centerY = top + ((top + height) * Math.maybeSeededRandom(0.3,0.7));
};

Enemy.prototype.follow = function(){
	if(this.contactX == null){ //if I'm chasing contactX will be a knife/weapon with a good chance of hitting at this point, otherwise will be null
		this.contactX = Math.floor(this.gridSize / 2);
		this.contactY = Math.floor(this.gridSize / 2);
	}
		
	var centerX;
	var centerY;
	if(this.nextTargetX != undefined){
		centerX = this.nextTargetX;
		centerY = this.nextTargetY;

	}
	else{
		if(this.target == player){
			centerX = player.myX + (player.heart.myX / 2);
			centerY = player.myY + (player.heart.myY / 2);
		}
		else{
			centerX = this.target.centerX;
			centerY = this.target.centerY;
		}
	}
	var toRight = centerX > (this.myX + this.contactX);
	var toBottom = centerY > (this.myY + this.contactY);
	var disRight = centerX - (this.myX + this.contactX); 
	var disBottom = centerY - (this.myY + this.contactY);
	
	var totalDis = Math.abs(disRight) + Math.abs(disBottom);
	
	var probRight = Math.abs(disRight) / totalDis;
	
	if(this.retreatingFromLandscapeX != undefined && this.retreatingFromLandscapeX != -1){ //I'm retreating horizontal meaning I hit at a certain height
		probRight = Math.min(1,Math.abs(this.myY - this.retreatingFromLandscapeX)/15) //yes X and Y is correct - I retreated horizontal but I need to get away vertical
	}
	else if(this.retreatingFromLandscapeY != undefined && this.retreatingFromLandscapeY != -1){
		probRight = Math.max(0, 1 - (Math.abs(this.myX - this.retreatingFromLandscapeY)/15)) //yes X and Y is correct - I retreated horizontal but I need to get away vertical
	}
	
	if(Math.maybeSeededRandom(0,1) < probRight){ //right/left
		this.movY = 0;
		if(toRight){
			this.movX = 1;
		}
		else{
			this.movX = -1;
		}
		this.disToTarget = Math.abs(disRight);
		
		if(this.retreatingFromLandscapeX != -1) //retreating manoeuvre is OVER - I'm back to going that way
			this.retreatingFromLandscapeX = -1;
	}
	else{
		this.movX = 0;
		if(toBottom){
			this.movY = 1;
		}
		else{
			this.movY = -1;
		}
		this.disToTarget = Math.abs(disBottom) / this.changeDirTrial();

		if(this.retreatingFromLandscapeY != -1) //retreating manoeuvre is OVER - I'm back to going that way
			this.retreatingFromLandscapeY = -1;

	}
	
	if(this.nextTargetX != undefined && centerX == this.nextTargetX){
		if(Math.maybeSeededRandom(0,1) > (totalDis/10))
			this.nextTargetX = undefined;
	}
	
	//if I've been stuck doing what I'm doing then try doing the opposite
	if(this.nextTargetX == undefined && Math.maybeSeededRandom(0,1) <   (Math.pow(Math.log(this.stuckScore),3) / 100) / totalDis   ){
		this.stuckScore = 0;
		this.aiCountDown = Math.round(Math.maybeSeededRandom(3,7));
		this.nextTargetX = centerX += Math.round(Math.maybeSeededRandom(-10,10));
		this.nextTargetY = centerY += Math.round(Math.maybeSeededRandom(-10,10));
		while(Math.maybeSeededRandom(0,1) > (Math.abs((this.myX + this.contactX) - this.nextTargetX) +  Math.abs((this.myY + this.contactY) - this.nextTargetY))  / 10){
			this.nextTargetX = centerX += Math.round(Math.maybeSeededRandom(-10,10));
			this.nextTargetY = centerY += Math.round(Math.maybeSeededRandom(-10,10));
		}

	}
};


//finds out what speed I would get if I changed direction without actually changing
Enemy.prototype.changeDirTrial = function(){
	var dir = 0;
	if(this.movY == -1)
		dir = 1;
	else if(this.movX == 1)
		dir = 2;
	else if(this.movY == 1)
		dir = 3;
	dir -= this.facing;
	if(dir < 0)
		dir += 4;
	dir -= 2;
	if(dir < 0)
		dir += 4;
	
	var newFastSpeed = Math.pow(2,this.fasterSpeeds[dir]);
	if(this.fasterSpeeds[dir] > 0){
		var mass = this.getMass();
		newFastSpeed = Math.max(newFastSpeed / mass,1);
	}
	return newFastSpeed;
};

Enemy.prototype.rotateAndExtract = function(){
	Person.prototype.rotateAndExtract.call(this);
	if(!this.extracted)
		this.stuckScore += 10;
}

//rotate face back to upright if needed and not in the middle of rotation
Enemy.prototype.maybeRotateHeart = function(){
	if(this.totalRotate != 0 && this.willRotateNext == 0 && this.rotation == 0){
		//console.log("rotating in makeRotateHeart " + new Date().getTime());
		this.heart.rotateBackAnimation();
	}
}

//turn weapons towards player
Enemy.prototype.setToFacing = function(targetCenterX, targetCenterY, preChoseX, preChoseY){
	//NOTE: this method is effectively making a decision on which direction to head in the same manner as follow, 
	//but instead of controlling the actual movement it is controlling the "turn to face"
	//because it's probabilistic the two methods may come up with contrasting results
	//TODO combine then? (would make it more efficient and mean this doesn't happen)
	//on the other hand the contrast between the two methods could create more unpredictable behaviour
	//TODO YES COMBINE because otherwise .contactX/contactY screws up
	if(Math.maybeSeededRandom(0,1) <   (Math.pow(Math.log(this.stuckScore),2) / 100) ){
		this.stuckScore = this.stuckScore / 2;
		return;
	}	
	if(preChoseX == undefined){
	
		if(this.target == undefined)
			return;

		
		if(targetCenterX == undefined){
			//0 = left, 1 = top, 2 = right, 3 = down TODO not standardized across game
			var targetCenterX = this.target.myX + ((this.target.maxX - this.target.minX) / 2);
			var targetCenterY = this.target.myY + ((this.target.maxY - this.target.minY) / 2);
		}
		
		var centerX = this.myX + ((this.maxX - this.minX) / 2);
		var centerY = this.myY + ((this.maxY - this.minY) / 2);
	
		var disX = centerX - targetCenterX;
		var disY = centerY - targetCenterY;
		
		
		////////just for working out probabilistically if I should go vertical or horizontal
		var disX2 = Math.abs(disX);
		var disY2 = Math.abs(disY);
		if(disX2 > disY2) //multiplying larger by 2 increases chances of making "correct" decision
			disX2 *= 2;
		else if(disY2 > disX2)
			disY2 *= 2;
		var totalDis = disX2 + disY2;
		//so if I'm a long away horizontally and short way away vertically I'm more likely to fake either left or right
		//and vice versa
		var chooseX = Math.maybeSeededRandom(0,1) < disX2 / totalDis; 
		///////////////////////////
		
		

	}
	
	//rotation probabilities
	var probs = new Array();
	var side;
	if(Math.abs(preChoseX) == 1 || chooseX){
		if(preChoseX == -1 || centerX > targetCenterX){//left side
			probs[0] = {turns:-1, val:getProb(this.dangerZones.left.strength,centerX - targetCenterX,this.dangerZones.top.strength,centerY - targetCenterY,1)};
			probs[1] = {turns:1, val:getProb(this.dangerZones.left.strength,centerX - targetCenterX,this.dangerZones.bottom.strength,targetCenterY - centerY,1)};
			probs[2] = {turns:2, val:getProb(this.dangerZones.left.strength,centerX - targetCenterX,this.dangerZones.right.strength,targetCenterX - centerX,2)};
			side = "left";
		}
		else{
			probs[0] = {turns:-1, val:getProb(this.dangerZones.right.strength,targetCenterX - centerX,this.dangerZones.bottom.strength,targetCenterY - centerY,1)};
			probs[1] = {turns:1, val:getProb(this.dangerZones.right.strength,targetCenterX - centerX,this.dangerZones.top.strength,centerY - targetCenterY,1)};
			probs[2] = {turns:2, val:getProb(this.dangerZones.right.strength,targetCenterX - centerX,this.dangerZones.left.strength,centerX - targetCenterX,2)};
			side = "right";
		}
	}
	else{
		if(preChoseY == -1 || centerY > targetCenterY){
			probs[0] = {turns:-1, val:getProb(this.dangerZones.top.strength,centerY - targetCenterY,this.dangerZones.right.strength,targetCenterX - centerX,1)};
			probs[1] = {turns:1, val:getProb(this.dangerZones.top.strength,centerY - targetCenterY,this.dangerZones.left.strength,centerX - targetCenterX,1)};
			probs[2] = {turns:2, val:getProb(this.dangerZones.top.strength,centerY - targetCenterY,this.dangerZones.bottom.strength,targetCenterY - centerY,2)};
			side = "top";
		}
		else{
			probs[0] = {turns:-1, val:getProb(this.dangerZones.bottom.strength,targetCenterY - centerY,this.dangerZones.left.strength,targetCenterX - centerX,1)};
			probs[1] = {turns:1, val:getProb(this.dangerZones.bottom.strength,targetCenterY - centerY,this.dangerZones.right.strength,centerX - targetCenterX,1)};
			probs[2] = {turns:2, val:getProb(this.dangerZones.top.strength,centerY - targetCenterY,this.dangerZones.top.strength,centerY - targetCenterY,2)};
			side = "bottom"
		}
	}
	
	//choose a direction based on probabilities - go for 1 turn directions first
	probs = probs.sort(compare);
	var selectedTurn = null;
	if(Math.maybeSeededRandom(0,1) < probs[0].val)
		selectedTurn = probs[0];
	else if(Math.maybeSeededRandom(0,1) < probs[1].val)
		selectedTurn = probs[1];
	else if(Math.maybeSeededRandom(0,1) < probs[2].val)
		selectedTurn = probs[2];
	
	if(Math.maybeSeededRandom(0,1) > difficulty){
		this.contactSide = null;
		if(selectedTurn == null)
			this.rotation = 0;
		else
			this.rotation = selectedTurn.turns;
	
		if(this.rotation == 2){
			this.rotation = (Math.round(Math.maybeSeededRandom(0,1)) * 2) - 1
			this.willRotateNext = this.rotation;
		}
	}
	
	
	//TODO - take into account of fans
	
	if(this.rotation != 0)
		this.rotateAndExtract();

	if(side == "left"){
		this.contactX = this.minX;
		this.contactY = this.dangerZones.left.along;
	}
	else if(side == "top"){ //top
		this.contactX = this.dangerZones.top.along;
		this.contactY = this.minY;
	}
	else if(side == "right"){ //right
		this.contactX = this.maxX;
		this.contactY = this.dangerZones.right.along;
	}
	else if(side == "bottom"){ //bottom
		this.contactX = this.dangerZones.bottom.along;
		this.contactY = this.maxY;
	}
		
};

function compare(a, b){
    if(a.val > b.val)
            return -1;
    else if(a.val < b.val)
            return 1;
    else
            return (Math.round(Math.maybeSeededRandom(0,1)) * 2) - 1;

}

function getProb(myStrength, myDis, theirStrength, theirDis){
	if(theirStrength <= myStrength) //side currently facing is already stronger than side will turn to
		return 0;
	var strGap = (theirStrength/myStrength)/10;
	var disGap = 1;
	if(theirDis > 0) //where this side may be facing roughly right direction anyway disGap will be smaller (range 0-1)
		disGap = myDis/(theirDis + myDis);
	//default to 1 where theirDis <= 0 i.e. this side is currently uselessly facing away
	//if(myDis <= 0)
		//alert("ERROR: something went wrong - getProb")
	return (strGap * disGap);

	
}

Enemy.prototype.setRunningFace = function(running){
	if(running)
		this.resetFace("badfaceScared");
	else
		this.resetFace(this.mainFace);

};

Enemy.prototype.fadeIn = function(){
	arrivalTime = timeStamp - 1;
	this.fadedCounter = 0;
	for(var x = 0; x < this.gridSize; x += 1){
		for(var y = 0; y < this.gridSize; y += 1){
			if(this.grid[x][y] != undefined && this.grid[x][y] != null){
					this.grid[x][y].image.opacity = 0.3;
					if(this.grid[x][y].type != "heart"){
						this.grid[x][y].image.animate('opacity', 1, {
							owner: this,
				            onComplete: function(){
				            	this.owner.completeFade();
				            },
		
				            duration: fadeDuration
						});
					}
			}
		}
	}
	this.group.animate('scaleX', 1, {
        duration: fadeDuration * 0.75,
        easing: fabric.util.ease.easeInBounce
	});
	this.group.animate('scaleY', 1, {
        duration: fadeDuration * 0.75,
        easing: fabric.util.ease.easeInBounce
	});
	this.group.animate('left', makeAnimateString(((this.myX * gridWidth) + (enemy.actualWidth / 2)) - this.group.left), {
        duration: fadeDuration * 0.75,
        easing: fabric.util.ease.easeInBounce
	});
	this.group.animate('top', makeAnimateString(((this.myY * gridHeight) + (enemy.actualHeight / 2)) - this.group.top), {
        duration: fadeDuration * 0.75,
        easing: fabric.util.ease.easeInBounce
	});
	
};

Enemy.prototype.resetFace = function(url, override){
	if(!override){
		if(this.isHurt && url != this.hurtFace && url != this.deadFace)
			return;
		if(this.running && url != "badfaceScared" && url != this.deadFace)
			return;
		if(this.blinder != undefined || this.blinder != null || this.scrambler != undefined || this.scrambler != null)
			return;
	}
	if( this.heart.image._objects != undefined){
		var oldWidth = this.heart.image._objects[0].width;
		var oldHeight = this.heart.image._objects[0].height;
		this.heart.image._objects[0].setElement(document.getElementById(url));
		this.heart.image._objects[0].width = oldWidth;
		this.heart.image._objects[0].height = oldHeight;		
		this.lastFace = url;
	}
};

Enemy.prototype.completeFade = function(){
	this.fadedCounter += 1;
	if(this.fadedCounter == this.totalNumBlocks - 1){
		this.heart.image.animate('opacity', 0.9, {
			owner: this,
            onComplete: function(){
            	
            	for(var x = 0; x < this.gridSize; x += 1){
            		for(var y = 0; y < this.gridSize; y += 1){
            			if(this.grid[x][y] != undefined && this.grid[x][y] != null && this.grid[x][y].type != "heart"){
            					this.grid[x][y].image.opacity = 1;
            			}
            		}
            	}
            	this.owner.readyToMove = true;
            	selectedSpawn.opacity = 0.2;
            },

            duration: fadeDuration2
		});

	}
};

Enemy.prototype.respondToDamage = function(){
	if(!this.readyToMove)
		return;
	this.stuckScore += 20;
	this.resetFace("badfaceHurt");
	//canvas.renderAll();
	this.isHurt = true;
};


///////////////////////////SPECIALS/////////////////////////////////////

Enemy.prototype.scramble = function(scrambler){
	this.resetFace("badfaceConfused");
	var options = [];
	this.keyCodes = [];
	this.keyCodesCount = [];
	Object.entries(selectedKeyCodes).forEach(([key, value]) => options.push(value));
	var ind;
	for (const [key, value] of Object.entries(selectedKeyCodes)) {
		ind = Math.maybeSeededRandom(0,options.length - 1);
		this.keyCodes[options.splice(ind,1)] = key;
	}
	this.scrambler = scrambler;

}

Enemy.prototype.unscramble = function(scrambler){
	this.resetFace("badface");
	this.keyCodes = [];
	//scrambling key codes when hit with a scramble block
	for (const [key, value] of Object.entries(selectedKeyCodes)) {
		this.keyCodes[value] = key;
	}		
	this.scrambler = null;
}

Enemy.prototype.blind = function(blinder){
	message.set("text", "enemy blinded");
	this.blinder = blinder;
	this.permanentlyRunning = true;
	this.countDownDecr = Math.maybeSeededRandom(0,0.5);
	this.resetFace("badfaceBlind", true);
	this.recreateGroup();
}

Enemy.prototype.guessScrambledCode = function(){
	var code;
	if(this.rotation == 1)
		code = selectedKeyCodes.clockwise;
	else if(this.rotation == -1)
		code = selectedKeyCodes.anticlockwise;
	else if(this.movX == 1)
		code = selectedKeyCodes.right;
	else if(this.movX == -1)
		code = selectedKeyCodes.left;
	else if(this.movY == 1)
		code = selectedKeyCodes.down;
	else if(this.movY == -1)
		code = selectedKeyCodes.up;
	
	
	var oldCode = code;
	if(this.keyCodesCount[code] == undefined)
		this.keyCodesCount[code] = 0;
	this.keyCodesCount[code]++;
	
	if(this.wrongCodes == undefined)
		this.wrongCodes = [code];
	
	if(Math.maybeSeededRandom() < (1 - (1 / this.keyCodes[code].count)) ){
		code = this.keyCodes[code];
		if(this.wrongCodes.length == 1){
			for (const [key, value] of Object.entries(selectedKeyCodes)) {
				if(value != oldCode && value != code)
					wrongCodes[wrongCodes.length - 1] = value; 
			}	
		}
		else if(this.wrongCodes.length == 0 || Math.maybeSeededRandom() < (1 - (this.wrongCodes.length/5)) ){
			code = oldCode;
			this.wrongCodes = undefined;
			this.scrambleCounder = undefined;
		}
		else{
			code = wrongCodes.splice(Math.maybeSeededRandom(0, wrongCodes.length - 1),1);
		}
		this.scrambleCounter = Math.maybeSeededRandom(0,2);

	}
	else{
		this.wrongCodes = undefined;
		this.scrambleCounder = undefined;
		
	}
	
	this.movX = 0;
	this.movY = 0;
	this.rotation = 0;
	if(code == selectedKeyCodes.clockwise)
		this.rotation = 1;
	else if(code == selectedKeyCodes.anticlockwise)
		this.rotation = -1;
	else if(code == selectedKeyCodes.right)
		this.movX = 1;
	else if(code == selectedKeyCodes.left)
		this.movX = -1;
	else if(code == selectedKeyCodes.up)
		this.movY = -1;
	else if(code == selectedKeyCodes.down)
		this.movY = 1;
	
	return(code)
}
