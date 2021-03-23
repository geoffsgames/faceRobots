


Motor.prototype = new Block();        // Here's where the inheritance occurs 
Motor.prototype.constructor=Motor;      

function Motor(type, ownerGrid, ownerImage,  owner, myX, myY, offsetX, offsetY, pointX, pointY){
	this.setup(type, ownerGrid, ownerImage,  owner, myX, myY, offsetX, offsetY, pointX, pointY);
	
}

Motor.prototype.setup = function(type, ownerGrid, ownerImage,  owner, myX, myY, offsetX, offsetY, pointX, pointY){
	
	
	Block.prototype.setup.call(this, type, ownerGrid, ownerImage,  owner, myX, myY, offsetX, offsetY, pointX, pointY);
	this.special = true;
	this.isBase = false;
	this.flyAwayRetries = 5;
	this.maxFlyDistance = 15;
	this.movX = 0;
	this.movY = 0;
	var found = false;
	this.neighbours = null;
	this.atEnd = false;
	this.tinyAnimateCount = 0;
	this.oldMovX = 0;
	this.moving = false;
	this.willDestroy = false;
	this.resistance = 2;
	this.needsCalc = false;

	
	//TODO if hasn't flown away. todo because might need to check it more specifically
	if(this.owner != null){
		for(var i =0, len = this.owner.motors.length; i < len; i+= 1){
			if(this.owner.motors[i].myX == myX && this.owner.motors[i].myY == myY){
				this.owner.motors[i] = this;
				this.motNum = i;
				found = true;
			}
		}
		if(!found){
			for(var i =0, len = this.owner.motors.length; i < len; i+= 1){
				if(this.owner.motors[i] == null){
					this.owner.motors[i] = this;
					this.motNum = i;
					found = true;
				}
			}
			if(!found){
				this.motNum = this.owner.motors.length;
				this.owner.motors.push(this);
				
			}
		}
		if(this.owner == player){
			this.owner.group.remove(this.image);
			this.draw(type,offsetX,offsetY,this.pointAngle,this.pointOffsetX,this.pointOffsetY);
		}

	}
};

Motor.prototype.adjust = function(){
	for(var i = 0; i < this.neighbours.length; i+= 1){
		this.neighbours[i].left = this.neighbours[i].myX * gridWidth;
		this.neighbours[i].top = this.neighbours[i].myY * gridHeight;

	}

};

Motor.prototype.jumpBack = function(){
	this.movX = -this.movX;
	this.movY = -this.movY;
	if(this.moveAll())
		this.disMoved += this.movX + this.movY;
	this.movX = -this.movX;
	this.movY = -this.movY;
};




Motor.prototype.update = function(){
		if(this.willDestroy){
			this.destroy(this.owner.getOtherRobot());
			this.willDestroy = false;
		}	
		if(this.movX == 0 && this.movY == 0){
			return false;
		}
		this.updateGrid(true);
		if(this.movefastCounter == 0 || this.movepartsSpeed_changing == 1){
			this.movefastCounter = this.movefastCounter + 1;
			this.movepartsCounter = this.movepartsCounter + 1;
			this.owner.recreated = false;
			if(this.moveAll()){
				this.disMoved += this.movX + this.movY;
				this.collided = this.checkCollision();
				if(this.neighbours == null || !this.moving)
					return false;
				//for testing the strength of knives
				if(this.collided)
					this.disMovedCut = 1;
				else
					this.disMovedCut += 1;
			}

		}
		else{
			this.movefastCounter = this.movefastCounter + 1;
			if(this.movefastCounter == this.movepartsSpeed_changing)
				this.movefastCounter = 0;
		}
		
		if(this.collided || this.atEnd)
			allComplete();
		else
			this.animate();
		
		this.updateGrid(false);
		
		return !(this.movX == 0 && this.movY == 0);
		
};

Motor.prototype.updateGrid = function(clear){
	if(this.neighbours == null || !this.moving)
		return;
	for(var i = 0; i < this.neighbours.length; i += 1){
		var x = this.neighbours[i].myX + this.owner.myX;
		var y = this.neighbours[i].myY + this.owner.myY;
		if(clear)
			gameGrid[x][y] = 1;
		else
			gameGrid[x][y] = this.neighbours[i];
	}
	
};

Motor.prototype.checkIntermediate = function(){
	if(this.movX != 0 || this.movY != 0){
		//movefastCounter counts to speed/origSpeed (e.g. 16, 8, 4). 
		//movepartsCounter counts the lack of the track
		//movefastCounter is the one that decides if the other robot is ready to do stuff
		//movepartsCounter == this.dis MAY HAPPEN SOONER, before movefastCounter == 0
		if((this.movefastCounter == 0 || this.movepartsSpeed_changing == 1) && this.movepartsCounter == this.dis){
			//adjust position
			this.adjust();
			this.movepartsCounter = 0;
			if(this.nextStep()){
				return true; //if finished
			}
		}
		return false;
	}
	return true;
};



Motor.prototype.destroy = function(other){
	if(this.collectable){
		Block.prototype.destroy.call(this, other);
		return;
	}
	
	if(this.moving){
		this.willDestroy = true;
		this.collided = true;
	}
	else{
		newMots = this.owner.motors;
		var deletedMot = false
		for(var i = 0; i < newMots.length && !deletedMot; i+= 1){
			var mot = newMots[i];
			if(mot == this){//found the motor that we want to delete
				newMots.splice(i,1);
				deletedMot = true;
			}
		}
		if(!deletedMot){
			//TODO figure out how to handle properly
			alert("motor to be deleted not found");
		}
		this.owner.motors = newMots;
		Block.prototype.destroy.call(this, other);
	}
}


Motor.prototype.checkCollision = function(){
	var movers = this.neighbours;
	var destroyBlocks = new Array();
	var modified = new Array();

	this.jumpedBack = false; 
	this.blocked = false;

	
	for(var i = 0; i < movers.length; i += 1){
		var myBlock = movers[i];
		var blockX = this.owner.myX + myBlock.myX;
		var blockY = this.owner.myY + myBlock.myY;
		if(blockX >= 0 && blockX < numPiecesX && blockY >= 0 && blockY < numPiecesY){//not off edge
			var otherBlock = gameGrid[blockX][blockY];
			if(otherBlock == undefined){ //is an obstacle block that has not yet been added
				addRandomDirScenery(this.owner.myX + myBlock.myX,this.owner.myY + myBlock.myY,"obstacle");//draw obstacle wonky indicating damage
				otherBlock = gameGrid[this.owner.myX + myBlock.myX][this.owner.myY + myBlock.myY];
			}
			if(otherBlock != 1 && otherBlock != null && !otherBlock.isAddPlace){//is an obstacle
				if(otherBlock.ownerImage != this.group){//there is a collision
					this.owner.handleCollision(myBlock,otherBlock,modified,destroyBlocks,this);
				}
			}
		}
		else{ //so can't punch off edge
			this.jumpedBack = true;
			this.blocked = true;
		}
	}
	
	if(this.jumpedBack){
		this.jumpBack();
		if(this.blocked){
			for(var i =0; i < modified.length; i += 1){
				modified[i].reset();
			}
		}
		else{
			for(var i =0; i < modified.length; i += 1){
				modified[i].confirmDamage();
			}
		}
	}	
	else{
		for(var i =0; i < modified.length; i += 1){
			modified[i].confirmDamage();
		}
		var owners = new Array();
		for(var i =0; i < destroyBlocks.length; i += 1){//record all enemies/landscape that possibly will be damaged
			//damage me or collect block in here
			destroyBlocks[i].destroy(this.owner);
			if(destroyBlocks[i].owner != undefined && destroyBlocks[i].owner != null && owners.indexOf(destroyBlocks[i].owner) === -1) //TODO owners.indexOf not implemented IE 8 and lower
				owners.push(destroyBlocks[i].owner);
		}
		for(var i =0; i < owners.length; i += 1){//damage enemy/landscape
			//don't call shrink now because when colliding 
			//I'm one step further forward than I think I am
			//this effects recreate group which is why collecting adjusts recreate group
			owners[i].willshrink = true; 
			owners[i].respondToDamage();
		}
	}
	
	return this.jumpedBack;

	
};


Motor.prototype.animate = function() {
	
	var group = this.group;
	var movX = this.movX;
	var movY = this.movY;
	var dist = (initialInterval / interval) / this.movepartsSpeed_fixed;
	this.animateSpin();
	
	
	if(!this.owner.recreated && (movX != 0 || movY != 0 )){
		//if game is running too fast don't do full animation as this slows things down, just move objects instead. Doesn't work with spring for some reason
		if(this.type != "spring" && (interval < 50 || dist >= (gridWidth / 2))){
			tinyAnimate(dist,group,movX,movY,this);
			allComplete();
			return;
		}
		this.tinyAnimateCount = 0;
		group.originX = "center";
		group.originY = "center";
		
			if(movX != 0){
				group.bringToFront();
				group.animate('left', makeAnimateString(Math.round(gridWidth / dist) * movX), {
		            onComplete: function(){
		            	allComplete();
		            },
			         duration: interval,
			         easing: fabric.util.ease.easeInSine
					});
			}
			else if(movY != 0){
				group.bringToFront();
				group.animate('top', makeAnimateString(Math.round(gridHeight / dist) * movY), {
			            onComplete: function(){
			            	allComplete();
			            },
			         duration: interval,
			         easing: fabric.util.ease.easeInSine
					});
			};
	};

};

Motor.prototype.calculateMovement = function(){
	if(this.moving){
		this.needsCalc = true;
		return;
	}
	this.working = true;
	this.needsCalc = false;
	this.owner.grid[this.myX][this.myY] = null;//remove this motor so that there is a gap in the robot which then enables the calculation of neighbours
	
	this.neighbours = [this];
	
	//blocks on the section of robot this motor moves
	this.neighbours = this.owner.getNeighbourBlocks(this.neighbours, this.myX,this.myY);
	
	this.owner.grid[this.myX][this.myY] = this;//...temporarily just to get neighbour blocks
	
	
	if(this.neighbours.length == 1){
		this.working = false;
		return;
	}
	
	for(var i =1; i < this.neighbours.length; i+= 1){
		this.neighbours[i].motor = this;
	}
	
	this.getDir();
	if(!this.working)
		return;
	
	if(this.chainedMotors == undefined || this.chainedMotors == null){
			this.chainedMotors = this.owner.linkChain(this.myX,this.myY);
			for(var i =0; i < this.chainedMotors.length; i+= 1){
				if(this.chainedMotors[i] != this)
					this.chainedMotors[i].startMoving();
				this.chainedMotors[i].chainedMotors = this.chainedMotors;
				this.chainedMotors[i].chainVisited = false;
			}
	}
	
}

Motor.prototype.isWorking = function(){
	return this.working;
}

Motor.prototype.canMove = function(){
	if(this.needsCalc)
		this.calculateMovement();
	if(!this.working)
		return false;
	return true;

}

Motor.prototype.startMoving = function(){

	
	this.base = this.origBase;
	if(this.base != null)
		this.base.baseOfMotor = this;
	this.reversing = false;

	this.moving = true;
	this.owner.updateGrid(false);
	this.drawGroup();

	this.movepartsCounter = 0;
	this.movefastCounter = 0;
	this.owner.getOtherRobot().movefastCounter = 0;
	numPlayers += 1;
	
	this.movX = this.oldMovX;
	this.movY = this.oldMovY;
	this.disMoved = 0;
	this.disMovedCut = 1;
	this.collided = false;
	var grow = 0;
	if(this.movX == 1)
		grow = this.rightNeigh + this.dis + 1;
	if(this.movX == -1)
		grow = this.leftNeigh - this.dis - 1;
	if(this.movY == 1)
		grow = this.bottomNeigh + this.dis + 1;
	if(this.movY == -1)
		grow = this.topNeigh - this.dis - 1;
	this.owner.growGrid(grow,grow);
	
	this.owner.actualWidth = gridWidth * this.owner.gridSize;
	this.owner.actualHeight = gridHeight * this.owner.gridSize;
	
	interval = minInt;
										//16,
	this.movepartsSpeed_fixed = Math.min(maxSpeed,Math.pow(2,this.dis));
	this.movepartsSpeed_changing = Math.round(maxSpeed / this.movepartsSpeed_fixed);
	this.owner.getOtherRobot().fastSpeed_changing = maxSpeed / this.owner.getOtherRobot().fastSpeed_fixed;
	this.owner.getOtherRobot().faster = true;

	this.step = 0;
	this.owner.minX = 0;
	this.owner.minY = 0;
	this.owner.maxX = this.owner.gridSize - 1;
	this.owner.maxY = this.owner.gridSize - 1;
};


//calculate track for motor
Motor.prototype.getDir = function(){
	var movX = 0;
	var movY = 0;
	
	////find possible length of track in every direction on side of motor opposite heart
	//TODO would be more efficient if this was calculated in calculate neighbours
	//calculate side of motor opposite heart
	var sideY = 0;
	var sideX = 0;
	var i =0;
	if(this.neighbours.length == 0){
		this.oldMovX = 0;
		this.oldMovY = 0;
		this.oldDis = 0;
		this.orientateImage();
		return;
	}
	while(i < this.neighbours.length && (sideX == 0 || sideY == 0)){
		var neigh = this.neighbours[i];
		if(neigh.myX == this.myX){
			if(neigh.myY == this.myY + 1)
				sideY = -1; //it's the opposite because neighbours are MOVING side (arm) and I'm looking for RUNWAY side
			else if(neigh.myY == this.myY - 1)
				sideY = 1;
		}
		if(neigh.myY == this.myY){
			if(neigh.myX == this.myX + 1)
				sideX = -1; //it's the opposite because neighbours are MOVING side (arm) and I'm looking for RUNWAY side
			else if(neigh.myX == this.myX - 1)
				sideX = 1;
		}
		i += 1;
	}
	
	
	
	
	//try right
	var r =0;
	while(this.isASquare(this.myX+r,this.myY+sideY,true) && (r == 0 || !this.isASquare(this.myX+r,this.myY,false)))
		r+=1;
	
	//try left
	var l =0;
	while(this.isASquare(this.myX-l,this.myY+sideY,true) && (l == 0 || !this.isASquare(this.myX-l,this.myY,false)))
		l+=1;


	//try bottom
	var b =0;
	while(this.isASquare(this.myX+sideX,this.myY+b,true) && (b == 0 || !this.isASquare(this.myX,this.myY+b,false)))
		b+=1;
	
	//try top
	var t =0;
	while(this.isASquare(this.myX+sideX,this.myY-t,true) && (t == 0 || !this.isASquare(this.myX,this.myY-t,false)))
		t+=1;

	r -= 1;
	l -= 1;
	b -= 1;
	t -= 1;
	
	var maxLR = Math.max(r,l);
	var maxBT = Math.max(b,t);
	
	if(Math.max(maxLR,maxBT) == 0){
		this.working = false;
		return;
	}
	
	this.origBase = this.owner.grid[this.myX + sideX][this.myY + sideY];

	//movX, movY = the direction motor will travel
	
	//choose the direction of travel based on the presence of weapons
	var weaponR = 0;
	var weaponL = 0;
	var weaponB = 0;
	var weaponT = 0;
	
	//for adjacent pointing weapons (not as powerful)
	var weaponR2 = 0;
	var weaponL2 = 0;
	var weaponB2 = 0;
	var weaponT2 = 0;
	
	var weaponsR = new Array();
	var weaponsL = new Array();
	var weaponsB = new Array();
	var weaponsT = new Array();
	
	var weaponStrength = 0;
	for(var i = 0; i < this.neighbours.length; i+= 1){
		var neigh = this.neighbours[i];
		if(neigh.isWeapon){
			if(neigh.myX > this.myX && neigh.pointX != -1){
				if(neigh.pointX == 1){
					weaponR += 1; //will collide forwards
					weaponsR.push(neigh);
				}
				else
					weaponR2 += 1; //will collide sideways
			}
			else if(neigh.myX < this.myX && neigh.pointX != 1){
				if(neigh.pointX == -1){
					weaponL += 1; //will collide forwards
					weaponsL.push(neigh);
				}
				else
					weaponL2 += 1; //will collide sideways
			}
			if(neigh.myY < this.myY && neigh.pointY != 1){
				if(neigh.pointY == -1){
					weaponT += 1; //will collide forwards
					weaponsT.push(neigh);
				}
				else
					weaponT2 += 2; //will collide sideways
			}
			else if(neigh.myY > this.myY && neigh.pointY != -1){
				if(neigh.pointY == 1){
					weaponB += 1; //will collide forwards
					weaponsB.push(neigh);
				}
				else
					weaponB2 += 1; //will collide sideways
			}
			
		}
	}
	
	//calculate which direction I should move based on distance and power
	weaponR = weaponR * Math.min(maxSpeed,Math.pow(2,r));
	if(r == 0){ //if distance is zero always go other way regardless of weapon power
		weaponR = 0;
		weaponL = Math.max(weaponL,1);
	}
	weaponL = weaponL * Math.min(maxSpeed,Math.pow(2,l));
	if(l == 0){
		weaponL = 0;
		weaponR = Math.max(weaponR,1);
	}
	
	if(weaponR > weaponL)
		movX = 1;
	else if(weaponL > weaponR)
		movX = -1;
	if(weaponB > weaponT)
		movY = 1;
	else if(weaponT > weaponB)
		movY = -1;
	
	//if weapons strength same on both sides take into account adjacents
	if(weaponR == weaponL){
		weaponR = weaponR2 * Math.min(maxSpeed,Math.pow(2,r));
		weaponL = weaponL2 * Math.min(maxSpeed,Math.pow(2,l));
		if(weaponR > weaponL)
			movX = 1;
		else if(weaponL > weaponR)
			movX = -1;
	}
	if(weaponT == weaponB){
		weaponT = weaponT2 * Math.min(maxSpeed,Math.pow(2,r));
		weaponB = weaponB2 * Math.min(maxSpeed,Math.pow(2,l));
		if(weaponB > weaponT)
			movY = 1;
		else if(weaponT > weaponB)
			movY = -1;
	}
	
	//if weapon strength still is the same both sides base on where I am in the robot
	//for now don't worry about both these also being the same (just default to right)
	if(weaponR == weaponL){
		if((this.myX - this.owner.minX) > (this.owner.maxX - this.owner.minX) / 2)
			movX = 1;
		else
			movX = -1;
	}
	if(weaponT == weaponB){
		if((this.myY - this.owner.minY) > (this.owner.maxY - this.owner.minY) / 2)
			movY = 1;
		else
			movY = -1;	
	}
	
	//choose the direction of travel based on distances
	if(maxLR > maxBT)
		movY = 0;
	else if(maxBT > maxLR)
		movX = 0;


	
	//record how strong the knives now are, now attached to motor
	if(movX == 1){
		addStrength(Math.min(maxSpeed,Math.pow(2,r)),weaponsR);
		this.dis = r;
		
		//TODO could do better than weaponsR[0] but very rarely likely to be necessary
		this.weapon = weaponsR[0]
	}
	else if(movX == -1){
		addStrength(Math.min(maxSpeed,Math.pow(2,l)),weaponsL);
		this.dis = l;
		
		this.weapon = weaponsL[0]
	}
	else if(movY == 1){
		addStrength(Math.min(maxSpeed,Math.pow(2,b)),weaponsB);
		this.dis = b;
		
		this.weapon = weaponsB[0]
	}
	else if(movY == -1){
		addStrength(Math.min(maxSpeed,Math.pow(2,t)),weaponsT);
		this.dis = t;
		
		this.weapon = weaponsT[0]
	}
	//end
	
	this.reversing = false;
	
	this.oldMovX = movX;
	this.oldMovY = movY;
	this.oldDis = this.dis;
	this.orientateImage();
};

Motor.prototype.getDis = function(){
	return this.dis;
}

Motor.prototype.draw = function(type,offsetX,offsetY,pointAngle,pointOffsetX,pointOffsetY){
	Block.prototype.draw.call(this, type,offsetX,offsetY,pointAngle,pointOffsetX,pointOffsetY);
	this.orientateImage();
};

Motor.prototype.orientateImage = function(){
	this.image._objects[0].setElement(document.getElementById("motor"));
	if(this.oldMovX == 1){
		this.image._objects[0].flipX = false;
		this.image._objects[0].angle = 0;
	}
	else if(this.oldMovX == -1){
		this.image._objects[0].angle = 0;
		this.image._objects[0].flipX = true;
	}
	else if(this.oldMovY == 1){
		this.image._objects[0].angle = 90;
		this.image._objects[0].flipX = false;
	}
	else if(this.oldMovY == -1){
		this.image._objects[0].angle = 90;
		this.image._objects[0].flipX = true;
	}
	else //stuck
		this.image._objects[0].setElement(document.getElementById("motorBroke"));
		
}



function addStrength(strength,knifeSet){
	for(var  i = 0; i < knifeSet.length; i+= 1){
		if(knifeSet[i].weaponStrength > 1){
			//if(knifeSet[i].spring == null || knifeSet[i].weaponStrength != Math.min(maxSpeed, Math.pow(2,knifeSet[i].spring.quantity)))
			//	alert("error setting knife strength from motor")
			var springStrength = knifeSet[i].weaponStrength;
			knifeSet[i].weaponStrength = Math.max(strength, springStrength);
		}
		else
			knifeSet[i].weaponStrength = strength;
	}
}

Motor.prototype.makeImage = function(type, offsetX, offsetY, pointAngle, pointOffsetX, pointOffsetY){
	Block.prototype.makeImage.call(this, type, offsetX, offsetY, pointAngle, pointOffsetX, pointOffsetY);
	var caption = ""
	if(this.owner == player)
		caption = (this.motNum + 1) +  ""
	var text = new fabric.Text(caption, {
		left: 0,
		top: 0,
		fontSize: 15,
		fontFamily: 'Comic Sans',
		originX: 'center',
		originY: 'center'
	});
	
	message.set('fill', 'red')

	
	var l = this.image.left;
	var t = this.image.top;
	
	this.image.left = 0;
	this.image.top = 0;
	
	this.image = new fabric.Group([this.image, text], {
			left:l,
			top:t
        });	
	
	//for animating it
	this.image.originX = "center";
	this.image.originY = "center";
	//this.image.left = this.image.left + (gridWidth/2);
	//this.image.top = this.image.top + (gridHeight/2);

};


Motor.prototype.isASquare = function(x,y, careAboutBases){
	if(x >= this.owner.grid.length || x < 0 || y >= this.owner.grid.length || y < 0)
		return false;
	if(this.owner.grid[x][y] == undefined || this.owner.grid[x][y] == null)
		return false;
	if((!careAboutBases || this.owner.grid[x][y].isBase) && (this.owner.grid[x][y].motor == undefined || this.owner.grid[x][y].motor == null ||  !this.owner.grid[x][y].motor.moving))
		return true;
};

Motor.prototype.clearAway = function() {
	
	Block.prototype.clearAway.call(this);
	if(this.movX != 0 || this.movY != 0){
		for(var i = 0, len = this.neighbours.length; i < len; i += 1){
			if(this.neighbours[i] != this)
				this.neighbours[i].clearAway();
		}
		this.stop();
	}
	
	if(this.owner != null){
		this.owner.motors[this.motNum] == null;
	};
		
};

Motor.prototype.nextStep = function(){	
	//0 = start (will happen anyway)
	//1 = reverse (or stop for testing)
	//2 = stop
	this.step += 1;

	if(this.step == 1){
		this.movX = -this.movX;
		this.movY = -this.movY;
		var mov = this.movX;
		if(mov == 0)
			mov = this.movY;
		this.disMoved = (this.dis - Math.abs(this.disMoved)) * mov;
		this.disMovedCut = 1;
		this.collided = false;
		return false;
	}
	else if(this.step == 2){	//TODO - checkMotors should take into account chained motors
		
		if(this.dis > 0){
			if(this.willReverse){ //for chained motors
				this.reverse();
				this.willReverse = false;
			}
			else if(this.owner.isEnemy && enemy.checkMotors(this) || (!this.owner.isEnemy && !this.owner.stoppedPressingMotor)){
				//if motor is continuing moving on a loop 
				this.reverse();
				if(this.chainedMotors != undefined && this.chainedMotors != null){
						for(var i = 0; i < this.chainedMotors; i+= 1){
							if(this.chainedMotors[i] != this)
								this.chainedMotors[i].willReverse = true;
						}
				}
				return false;
			}
		}
		this.owner.motorWillStart = null;
		this.stop();
		return true;
	}
};

Motor.prototype.reverse = function(){
	this.step = 0;
	this.movX = -this.movX;
	this.movY = -this.movY;
	var mov = this.movX;
	if(mov == 0)
		mov = this.movY;
	this.disMoved = (this.dis - Math.abs(this.disMoved)) * mov;
	this.disMovedCut = 1;
	this.collided = false;
	this.owner.motorRestarted = true;
};

Motor.prototype.stop = function(){
	if(this.base != undefined && this.base != null){
		this.base.baseOfMotor = null;
		this.base = null;
	}
	this.owner.motorJustStopped = true;
	this.movX = 0;
	this.movY = 0;
	numPlayers -= 1;
	
	this.movepartsSpeed_fixed = 1;
	this.movepartsSpeed_changing = 1;
	this.atEnd = false;

	this.moving = false;
	this.chainedMotors = null;
};

Person.prototype.stopMotors = function(){
	
	this.movX = this.oldMovX;
	this.movY = this.oldMovY;
	this.dontStartMotors = true;
	otherRob = this.getOtherRobot();
	if(!otherRob.partsMoving){
			//other robot is moving fast due to reason other than motor/spring (i.e. fans) and we would come out currently in an intermediate time because of this
			if(enemy.readyToMove && otherRob.movefastCounter > 0 && (otherRob.movefastCounter != otherRob.fastSpeed_changing) && (otherRob.movX != 0 || otherRob.movY != 0) && !otherRob.collided && !otherRob.recreated){
				//is intermediate - don't reset interval just yet
				this.faster = true;
				otherRob.faster = false;
				this.willResetInterval = true;
				this.movefastCounter = 0;
				this.fastSpeed_changing = otherRob.fastSpeed_changing - otherRob.movefastCounter;
				this.fastSpeed_fixed = maxSpeed / this.fastSpeed_changing;
				this.movethistime = true; //allows single one off movement
			}
			else{//not intermediate so can go back to normal interval
				this.justResumed = true;
				this.resetInterval();
			}
			otherRob.recreated = false;
	}
	else{
		this.movefastCounter = 0;
		this.resetInterval();
	}
	this.recreated = false;

	
};

Person.prototype.resetInterval = function(){
	this.willResetInterval = false;
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

		var otherRob = this.getOtherRobot();
		this.fastSpeed_fixed = Math.min(maxSpeed,Math.pow(2,this.fasterSpeeds[dir]));
		if(enemy.readyToMove){
				if(otherRob.partsMoving){
					this.fastSpeed_changing = maxSpeed / this.fastSpeed_fixed;
					
				}
				else{
					
					//ensure adjust speeds properly IN THE CASE OF FANS ALSO BEING USED
					if(otherRob.fastSpeed_fixed > this.fastSpeed_fixed){
						otherRob.faster = true;
						this.faster = false;
						interval = (initialInterval / otherRob.fastSpeed_fixed);
						otherRob.fastSpeed_changing = otherRob.fastSpeed_fixed / this.fastSpeed_fixed;
						this.fastSpeed_changing = 1;
					}
					else if(this.fastSpeed_fixed == otherRob.fastSpeed_fixed){
						this.faster = true;
						otherRob.faster = true;
						interval = initialInterval / this.fastSpeed_fixed;
						otherRob.fastSpeed_changing = 1;
						this.fastSpeed_changing = 1;
					}
					else{
						otherRob.faster = false;
						this.faster = true;
						interval = (initialInterval / this.fastSpeed_fixed);
						otherRob.fastSpeed_changing = 1;
						this.fastSpeed_changing = this.fastSpeed_fixed / otherRob.fastSpeed_fixed;
					}
					otherRob.movefastCounter = 0;
					this.movefastCounter = 0;
					otherRob.resetPos();
		
					
				}
		
		}
		else{//waiting for enemy to fade in
			interval = (initialInterval / this.fastSpeed_fixed);
			this.fastSpeed_changing = 1;
			this.faster = true;
		}
		
		intermediate = false;
		this.resetPos();
};

Motor.prototype.moveAll = function(){
	if(Math.abs(this.disMoved + this.movX + this.movY) <= this.dis){
		this.atEnd = false;
		var moving = true;
		for(var i = 0; i < this.neighbours.length && moving; i+= 1)
			moving = this.neighbours[i].move(this.movX,this.movY,this.reversing);
		return moving;
	}
	else{
		this.atEnd = true;
		return false;
	}
};

Motor.prototype.rotate = function(angle){
	if(angle == 1){
		if(this.oldMovX != 0){
			this.oldMovY = this.oldMovX
			this.oldMovX = 0;
		}
		else{
			this.oldMovX = -this.oldMovY;
			this.oldMovY = 0;
		}
	}
	else{
		if(this.oldMovX != 0){
			this.oldMovY = -this.oldMovX
			this.oldMovX = 0;
		}
		else{
			this.oldMovX = this.oldMovY;
			this.oldMovY = 0;
		}
	}
}

Motor.prototype.animateSpin = function(){	
	this.image.animate('angle', makeAnimateString(360), {
     duration: 100
	});


};


Block.prototype.move = function(movX, movY, reversing){
	if(this.owner.grid[this.myX][this.myY] == this)
		this.owner.grid[this.myX][this.myY] = null;
	this.myX += movX;
	this.myY += movY;
	this.owner.grid[this.myX][this.myY] = this;
	return true;
};

Motor.prototype.move = function(movX, movY, reversing){
	if(this.movX != 0 || this.movY != 0){
		
		var nextX = this.base.myX + this.movX;
		var nextY = this.base.myY + this.movY;
		
		//if section of the track has disappeared
		if(this.owner.grid[nextX][nextY] == undefined || this.owner.grid[nextX][nextY] == null){
			this.movX = -this.movX;
			this.movY = -this.movY;
			this.dis = this.movepartsCounter - 1;
			this.movepartsCounter = 0;
			return false; //failed to move
		}
		
		Block.prototype.move.call(this, movX, movY, reversing);
		this.base.baseOfMotor = null;
		
		
		//change base because I've slid onto next square
		//report what my base (piece supporting me) is
		this.base = this.owner.grid[this.base.myX + movX][this.base.myY + movY];
		
		//report to my base (piece supporting me) that I am it's motor
		this.base.baseOfMotor = this;

	}
	return true;
};

//draw all objects connected to me into a group
Motor.prototype.drawGroup = function(){	
	this.leftNeigh = this.myX;
	this.topNeigh = this.myY;
	this.rightNeigh = this.myX;
	this.bottomNeigh = this.myY;
	this.group = new fabric.Group();
	this.group.angle = 0;
	this.group.originX = "this.left";
	this.group.originY = "this.top";
	
	//find the part of my arm that sticks out the most
	for(var i =0 ; i < this.neighbours.length; i+= 1){
		if(this.neighbours[i].myX < this.leftNeigh)
			this.leftNeigh = this.neighbours[i].myX;
		if(this.neighbours[i].myY < this.topNeigh)
			this.topNeigh = this.neighbours[i].myY;
		if(this.neighbours[i].myX > this.rightNeigh)
			this.rightNeigh = this.neighbours[i].myX;
		if(this.neighbours[i].myY > this.bottomNeigh)
			this.bottomNeigh = this.neighbours[i].myY;
		this.owner.group.remove(this.neighbours[i].image);
	}
	for(var i =0 ; i < this.neighbours.length; i+= 1){
		this.neighbours[i].left = (this.neighbours[i].myX - this.leftNeigh) * gridWidth + (gridWidth / 2);
		this.neighbours[i].top = (this.neighbours[i].myY - this.topNeigh) * gridHeight + (gridHeight / 2);
		this.group.add(this.neighbours[i].image);
	}
	
	this.owner.group.add(this.group);
	this.group.selectable = false;
};

