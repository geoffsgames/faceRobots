var flyawaySpeed = 100;

var flyAwayMin = 5;
var flyAwayOptimal = 10;
var flyAwayMax = 20;

var reversePoint = 0;

//doesn't do anything - just holds place and type for adding a real block later
//used when designing enemies
var TempBlock = function (type, myX, myY){ 
	this.type = type;
	this.myX = myX;
	this.myY = myY;
};

//ownerImage = group (if part of character) or canvas (if part of landscape or collectable block)
var Block = function (type, ownerGrid, ownerImage, owner, myX, myY, offsetX, offsetY, pointX, pointY) { 
	this.setup(type, ownerGrid, ownerImage, owner, myX, myY, offsetX, offsetY, pointX, pointY);
};

Block.prototype.getWall = function(){
	var element;
	if(this.owner != null && this.owner.isEnemy)
		element = document.getElementById("wallDark");
	else
		element = document.getElementById("wall");
	
	return(new fabric.Image(element, {
		left: 0,
		top: 0,
		width: gridWidth,
		height: gridHeight
	}));
};

Block.prototype.recreate = function(ownerImage, myX, myY, offsetX, offsetY){
	this.ownerImage = ownerImage;
	this.ownerGrid = this.owner.grid;
	this.myX = myX;
	this.myY = myY;
	this.offsetX = offsetX;
	this.offsetY = offsetY;
	//use originally calculated points but adjust in case angle has changed
	this.getPoints();
	this.calculatePoints();
	
	this.draw(this.type,offsetX,offsetY,this.pointAngle,this.pointOffsetX,this.pointOffsetY);
};

Block.prototype.setup = function(type, ownerGrid, ownerImage, owner, myX, myY, offsetX, offsetY, pointX, pointY){
	this.canAddMore = false;

	//for damaging others
	this.forwardStrength = 0;//head on
	this.sideStrength = 0;
	//for being damaged
	this.resistance = 1;
	this.origStrength = this.resistance;

	this.ownerGrid = ownerGrid;
	this.ownerImage = ownerImage;
	this.pointSet = false;
	this.startingStrength = 1;
	this.myX = myX;
	this.myY = myY;
	this.baseOfMotor = null;
	this.angleAdjusted = false;
	//for keeping the appearance of damage (the wonkiness) consistent when  block recreated
	this.damageAngle = 0;
	
	this.maxFlyDistance = 30;
	// >1 in more valuable blocks to reduce the chance of them leaving the grid and being lost
	this.flyAwayRetries = 1;
	if(pointX != undefined){
		this.pointX = pointX;
		this.pointY = pointY;
	}
	else{
		this.pointX = 0;
		this.pointY = 0;
	}
	this.owner = owner;
	this.blank = false;
	this.type = type;
	this.heart = false;
	this.isBase = true;
	this.offsetX = offsetX;
	this.offsetY = offsetY;
	if(pointX == undefined)
		this.calculatePoints();
	this.getPoints();
	this.weaponStrength = 0;
	this.draw(type,offsetX,offsetY,this.pointAngle,this.pointOffsetX,this.pointOffsetY);
	this.spring = null
};

Block.prototype.calculatePoints = function(){
	if(!this.usePoints || this.owner == null)
		return;
	
	if(this.reversePoint == undefined){
		this.reversePoint = reversePoint;
		reversePoint += 1;
	}
	
	this.pointX = 0;
	this.pointY = 0;

	var pointDir = -1;
	var springSquare = null;
			//which way points for things like knives
			var basesX = []; //left, top, right, down
			var basesY = [];
			if(this.owner.occupied(this.myX + 1, this.myY) && this.owner.grid[this.myX + 1][this.myY].isBase){
				basesX.push(0);
				if(this.owner.grid[this.myX + 1][this.myY].type == "spring" && this.isWeapon){
					pointDir = 0;
					springSquare = this.owner.grid[this.myX + 1][this.myY];
				}
			}
			if(this.owner.occupied(this.myX - 1, this.myY) && this.owner.grid[this.myX - 1][this.myY].isBase){
				basesX.push(1);
				if(this.owner.grid[this.myX - 1][this.myY].type == "spring" && this.isWeapon){
					pointDir = 1;
					springSquare = this.owner.grid[this.myX - 1][this.myY];
				}
			}
			if(pointDir == -1){
					if(this.owner.occupied(this.myX, this.myY + 1) && this.owner.grid[this.myX][this.myY + 1].isBase){
						basesY.push(0);
						if(this.owner.grid[this.myX][this.myY + 1].type == "spring" && this.isWeapon){
							pointDir = 2;
							springSquare = this.owner.grid[this.myX][this.myY + 1];
						}

					}
					if(this.owner.occupied(this.myX, this.myY - 1) && this.owner.grid[this.myX][this.myY - 1].isBase){
						basesY.push(1);
						if(this.owner.grid[this.myX][this.myY - 1].type == "spring" && this.isWeapon){
							pointDir = 3;
							springSquare = this.owner.grid[this.myX][this.myY - 1];
						}

					}
			}
			
			
			if(springSquare == null){
					//if surrounded on both (opposite) sides by blocks will be point directly at other block
					if(basesX.length > 1)
						basesX = [];
					if(basesY.length > 1)
						basesY = [];
					
					if(basesX.length == 1){
						pointDir = basesX[0];
					}
					if(basesY.length == 1 && (pointDir == -1 || (this.reversePoint % 2 == 0) )) //reversePoint just ensures when adding blocks in edit mode doesn't always go the same way (can't use random as that will course knives to randomly change direction at other times)
						pointDir = basesY[0] + 2;
					//unlikely except in giants - either isolated or completely surrounded
					if(pointDir == -1)
						pointDir = this.reversePoint % 4;
			}
			else{
				springSquare.pointToKnife(pointDir,this);
			}
			
			if(pointDir == 0){
				this.pointX = -1;
				
			}
			else if(pointDir == 1){
				this.pointX = 1;
			}
			else if(pointDir == 2)
				this.pointY = -1;
			else if(pointDir == 3)
				this.pointY = 1;
			this.getPoints();

};

Block.prototype.redraw = function(remove){
	if(remove)
		this.ownerImage.removeWithUpdate(this.image);
	this.draw(this.type,this.offsetX,this.offsetY,this.pointAngle,this.pointOffsetX,this.pointOffsetY);
};


Block.prototype.getPoints = function(){
	//point is for objects like knives where it effects impact etc and other objects when it effects how it is drawn
	//pointOffset is for drawing the rotated pieces (normal rotation adjustment)
	//offset is because group is center, not left or top aligned
	var pointAngle = 0;//assume pointing left
	var pointOffsetX = 0;
	var pointOffsetY = 0;

	if(this.pointX == 1){
		pointAngle = 180;
		pointOffsetX = gridWidth;
		pointOffsetY = gridHeight;
	}
	else if(this.pointY == -1){
		pointAngle = 90;
		pointOffsetX = gridWidth;
	}
	else if(this.pointY == 1){
		pointAngle = 270;
		pointOffsetY = gridHeight;
	}
	
	this.pointOffsetX = pointOffsetX;
	this.pointOffsetY = pointOffsetY;
	this.pointAngle = pointAngle;

	
};

Block.prototype.draw = function(type,offsetX,offsetY,pointAngle,pointOffsetX,pointOffsetY){
	this.makeImage(type,offsetX,offsetY,pointAngle,pointOffsetX,pointOffsetY);
	if(this.ownerImage != undefined){
		this.ownerImage.addWithUpdate(this.image);
	}
	this.origLeft = this.image.left;
	this.origTop = this.image.top;

};

Block.prototype.makeImage = function(type,offsetX,offsetY,pointAngle,pointOffsetX,pointOffsetY){
	var wallType = "wall";
	if(this.owner != null && this.owner.isEnemy)
		wallType = "wallDark"
	
	if(type == "wall")
		type = wallType;
	
	if(type == "chain" && this.owner != null && this.owner.isEnemy)
		type = "chainDark";


	
	//pointOffset and offset- see above
	this.image = new fabric.Image(document.getElementById(type), {
		originX: "center",
		originY: "center",
		left: (this.myX * gridWidth) - offsetX + (gridWidth/ 2),// + pointOffsetX,
		top: (this.myY * gridHeight) - offsetY + (gridHeight/2),// + pointOffsetY,
		width: gridWidth,
		height: gridHeight,
		angle: pointAngle
	});
	
	if(this.backgroundedImage){
		var bgImg = new fabric.Image(document.getElementById(wallType), {
			originX: "center",
			originY: "center",
			left: 0,
			top: 0,
			width: gridWidth,
			height: gridHeight,
			angle: 0
		});
		this.image.left = 0;
		this.image.top = 0;
		var imgGroup = new fabric.Group([bgImg, this.image], {
				originX: "center",
				originY: "center",
			  left: (this.myX * gridWidth) - offsetX + (gridWidth/ 2),
			  top: (this.myY * gridHeight) - offsetY + (gridHeight/2)
			});
		
		this.image = imgGroup;
	}

};

Block.prototype.directionMatches = function(movX, movY) {
	return (movX == this.pointX && movY == this.pointY);
};

Block.prototype.adjustForMotor = function(block,strength){

	
	
	
	if(block.motor == null || block.motor == undefined || !block.motor.moving)
		return strength;
	else{
		if(this.owner == null || this.owner == undefined)
			return (strength * block.motor.disMovedCut);

		var myMovX = this.owner.movX;
		var mySpeed = this.owner.fastSpeed_fixed;

		if(this.motor != null && this.motor != undefined && this.motor.moving){
			myMovX = this.motor.movX;
			mySpeed = this.motor.movepartsSpeed_fixed;
		}

		if(mySpeed > block.motor.movepartsSpeed && Math.abs(myMovX - block.motor.movX) != 1)
			return strength;
		return (strength * block.motor.disMovedCut);
	}	
};

//finds out if I'm destroyed by other and if so records it
Block.prototype.destroyedBy = function(other, modified, destroyed, forwards,alreadyHit,mot) {
	this.oldAngle = this.image.angle;
	if(this.collectable){ //if collectable will always destroy
		if(mot != undefined && mot != null)
			return false;
		destroyed.push(this);
		if(this.usePoints){
			this.pointX =	other.owner.movX;
			this.pointY = 	other.owner.movY;
			this.pointSet = true;
		}
		return true;
	}
	else if(other.collectable)//if collecting collectable will not damage me
		return false;
	

	var impact;
	
	if(alreadyHit == 0){
		if(forwards)
			impact = this.adjustForMotor(other,other.forwardStrength);
		else
			impact = this.adjustForMotor(other,other.sideStrength);
	}
	else{
		impact = alreadyHit;
	}
	
	if(impact > this.sideStrength){
		this.oldStrength = this.resistance;
		
		
		
		
		
		
		
		
		this.resistance -= impact;
		if(debugMode && this.owner != null){
			this.owner.textGrid[this.myX][this.myY] = this.type + "." + this.resistance;
			
		}
	}
	
	
	modified.push(this);
	
	if(this.resistance < 0){
		if(other.motor != undefined && other.motor != null && other.motor.moving){
			var newX = this.myX + other.motor.movX;
			var newY = this.myY + other.motor.movY;
			if(this.owner != undefined && this.owner != null){
				newX = newX + this.owner.myX;
				newY = newY + this.owner.myY;
			}
			if(newY < numPiecesX && newY >= 0 && newX < numPiecesX && newX >= 0){
				neighbour = gameGrid[newX][newY];
				if(neighbour == undefined){ //is an obstacle block that has not yet been added
					addRandomDirScenery(newX,newY,"obstacle");//draw obstacle wonky indicating damage
					neighbour = gameGrid[newX][newY];
				}
				if(neighbour != 1)//if the force (impact) is more than strong enough to destroy me then try to destroy neighbouring blocks as well
					neighbour.destroyedBy(other, modified, destroyed, forwards,-this.resistance);
			}
		}
		destroyed.push(this);
	}
	return this.resistance < 0 && impact > this.sideStrength;
};

Block.prototype.confirmDamage = function(){
	if(this.resistance < this.oldStrength){ //the "wobbling" effect when it't just been hit
		this.damageAngle = 0;//because otherwise refuses to show damage (that restricting implemented to stop it showing damage every time player redraws)
		this.showDamage();
		this.saveDamage();
	}

}

Block.prototype.saveDamage = function(){
	
};

Block.prototype.increment = function(){
	
}


Block.prototype.showDamage = function(){
	if(this.damageAngle == 0){
		var damageExtent = this.origStrength / Math.max(this.resistance,1); 
		this.damageAngle = this.pointAngle + ((Math.maybeSeededRandom(-2, 2)) * damageExtent);
		this.damageLeft = (Math.maybeSeededRandom(-1, 1)) * damageExtent;
		this.damageUp = (Math.maybeSeededRandom(-1, 1)) * damageExtent;
	}
	if(this.type == "spring")
		this.damageAngle -= this.pointAngle;
	this.image.angle = this.damageAngle;
	this.image.left = this.origLeft + this.damageLeft;
	this.image.top = this.origTop + this.damageUp;

};


Block.prototype.isDamaged = function() {
	return this.resistance < this.oldStrength;
};

Block.prototype.destroy = function(other) {
	if(this.ownerGrid[this.myX][this.myY] == this){ //hasn't already been removed
		this.clearAway();

		//the motor that I support
		if(this.baseOfMotor != null)
			this.baseOfMotor.clearAway();
		if(this.collectable){
			other.collect(this);
		}
		
		if(this.owner != null && this.type != "heart"){
			//remove all attached pieces on side away from heart
			this.owner.destroyNeighbourBlocks(this.myX,this.myY);
		}
	}
};

//function isOnCanvas(block){
//	var objs = canvas._objects;
//	for(var i =0; i < objs.length; i += 1){
//		if(objs[i] === block.image)
//			return true;
//	}
//	return false;
//}
Block.prototype.clearAway = function(){
	if(this.owner != undefined && this.owner != null)
		this.owner.weapons.delete(this);

	if(this.motor != null && this.motor.moving && (this.motor.movX != 0 || this.motor.movY != 0)){
		var neighbours = [];
		for(var i = 0; i < this.motor.neighbours.length; i+= 1){
			if(this.motor.neighbours[i] != this)
				neighbours.push(this.motor.neighbours[i]);
		}
		this.motor.neighbours = neighbours;
		this.motor = null;
	}
	if(this.spring != null && this.spring.moving){
		this.spring.weapon = null;
		this.spring = null;
	}
	
	
	if(this.collectable)
		this.image.opacity = 0; //as remove seems to be unreliable - hide as well
	this.ownerImage.remove(this.image);

	if(this.ownerGrid == gameGrid)
		this.ownerGrid[this.myX][this.myY] = 1;
	else
		this.ownerGrid[this.myX][this.myY] = null;
	if(this.owner != null){//part of robot
		if(this.owner.hasLeftGrid)
			return; //doesn't fly away if has already left grid
		
		if(gameGrid[this.myX + this.owner.myX][this.myY + this.owner.myY] == this)
			gameGrid[this.myX + this.owner.myX][this.myY + this.owner.myY] = 1;
		else if(gameGrid[this.myX + this.owner.myX - this.owner.movX][this.myY + this.owner.myY - this.owner.movY] == this)
			gameGrid[this.myX + this.owner.myX - this.owner.movX][this.myY + this.owner.myY - this.owner.movY] = 1;
		else if(gameGrid[this.myX + this.owner.myX + this.owner.movX][this.myY + this.owner.myY + this.owner.movY] == this)
			gameGrid[this.myX + this.owner.myX + this.owner.movX][this.myY + this.owner.myY + this.owner.movY] = 1;
		
		this.flyAway();
		//var index = this.owner.myBlocks.indexOf(this);
		//this.owner.myBlocks.splice(index, 1);
		this.owner.totalNumBlocks -= 1;

		if(debugMode)
			this.owner.textGrid[this.myX][this.myY] = 0;
	}
	
	if(this.spring != null)
		this.spring.weapon = null;
	
};

Block.prototype.checkForSprings = function(){
	if(this.myX > 0 && this.owner.grid[this.myX - 1] != undefined && this.owner.grid[this.myX - 1][this.myY] != undefined && this.owner.grid[this.myX - 1][this.myY] != null && this.owner.grid[this.myX - 1][this.myY].type == "spring" )
		this.spring = this.owner.grid[this.myX - 1][this.myY];
	if(this.myY > 0 && this.owner.grid[this.myX][this.myY - 1] != undefined && this.owner.grid[this.myX][this.myY - 1] != null && this.owner.grid[this.myX][this.myY - 1].type == "spring" )
		this.spring = this.owner.grid[this.myX][this.myY - 1];
	if(this.myX < this.owner.gridSize - 1 && this.owner.grid[this.myX + 1] != undefined && this.owner.grid[this.myX + 1][this.myY] != undefined && this.owner.grid[this.myX + 1][this.myY] != null && this.owner.grid[this.myX + 1][this.myY].type == "spring" )
		this.spring = this.owner.grid[this.myX + 1][this.myY];
	if(this.myY <  this.owner.gridSize - 1  && this.owner.grid[this.myX][this.myY + 1] != undefined && this.owner.grid[this.myX][this.myY + 1] != null && this.owner.grid[this.myX][this.myY + 1].type == "spring" )
		this.spring = this.owner.grid[this.myX][this.myY + 1];
	
	if(this.spring != null)
		this.spring.weapon = this;
}

Block.prototype.getFlyAwayImage = function(){
	return this.image;
}

Block.prototype.flyAway = function() {
	
	var curX = this.myX + this.owner.myX;
	var curY = this.myY + this.owner.myY;
	
	var newX;
	var newY;
	
	//has to be at least 5 spaces from origin
	if(Math.maybeSeededRandom(0,1) > 0.5){
		newX = curX + (Math.floor(Math.seededRandomDouble(0,Math.min((numPiecesX/2),this.maxFlyDistance) )) * (Math.round(Math.maybeSeededRandom(0,2)) - 1));
		newY = curY + (Math.floor(Math.seededRandomDouble(5,Math.min((numPiecesY/2),this.maxFlyDistance) )) * (Math.round(Math.maybeSeededRandom(0,2)) - 1));
	}
	else{
		newX = curX + (Math.floor(Math.seededRandomDouble(5,Math.min((numPiecesX/2),this.maxFlyDistance))) * (Math.round(Math.maybeSeededRandom(0,2)) - 1));
		newY = curY + (Math.floor(Math.seededRandomDouble(0,Math.min((numPiecesY/2),this.maxFlyDistance) )) * (Math.round(Math.maybeSeededRandom(0,2)) - 1));
	}
	
	var inside = newX < numPiecesX - 1 && newY < numPiecesY - 1 && newX > 0 && newY > 0;
	//if on screen check that isn't overlapping something else
	var retries = 0;
	while(
			
			(inside &&
					
					
					((gameGrid[newX][newY] != 1)
			|| (gameGrid[newX + 1][newY] != 1)
			
			|| (gameGrid[newX - 1][newY] != 1)
			
			|| (gameGrid[newX][newY + 1] != 1)
			
			|| (gameGrid[newX][newY - 1] != 1)
			
			|| nextToAlreadyCollect(newX, newY)))
			
	
			|| (!inside && retries < this.flyAwayRetries)
			
			) //try a given number of times to land the block in screen. More powerful blocks less likely to leave screen.
				{
					if(Math.maybeSeededRandom(0,1) > 0.5){
						newX = curX + (Math.floor(Math.seededRandomDouble(0,Math.min((numPiecesX/2),this.maxFlyDistance) )) * (Math.round(Math.maybeSeededRandom(0,1)) * 2 - 1));
						newY = curY + (Math.floor(Math.seededRandomDouble(5,Math.min((numPiecesY/2),this.maxFlyDistance) )) * (Math.round(Math.maybeSeededRandom(0,1)) * 2 - 1));
					}
					else{
						newX = curX + (Math.floor(Math.seededRandomDouble(5,Math.min((numPiecesX/2),this.maxFlyDistance))) * (Math.round(Math.maybeSeededRandom(0,1)) * 2 - 1));
						newY = curY + (Math.floor(Math.seededRandomDouble(0,Math.min((numPiecesY/2),this.maxFlyDistance) )) * (Math.round(Math.maybeSeededRandom(0,1)) * 2 - 1));
					}
					inside = newX < numPiecesX - 1 && newY < numPiecesY - 1 && newX > 0 && newY > 0;
					retries += 1;
	}
	
	this.flyAwayCounter = 0;
	
	var img = this.getFlyAwayImage()
	
	//add in the starting position to start animation
	canvas.add(img);
	//canvas.renderAll();
	img.opacity = 1;
	img.left = (this.myX + this.owner.myX) * gridWidth;
	img.top = (this.myY + this.owner.myY) * gridHeight;
	
	potentialCollectables.push([newX,newY]);
	
	img.animate('left', (newX * gridWidth), {
		  myType: this.type,
		  myImg: img,
		  endX: newX,
		  endY: newY,
		  myGameGrid: gameGrid, //to ensure doesn't add if I've just restarted the game
          onComplete: function() {
        	  	if(gameGrid == this.myGameGrid){
        	  		this.myImg.opacity = 0;
        	  		canvas.remove(this.myImg);
        	  		if(this.endX < numPiecesX && this.endX >= 0 && 
        	  				this.endY < numPiecesY && this.endY >= 0){        	  			
        	  			//because adding directly into collectables here doesn't work for reasons unknown
        	  			//will add at the start of an update
        	  			newCollectables.push([this.endX, this.endY, this.myType]);     	  			
           	  		}
        	  	}
          }
          ,
       duration: flyawaySpeed,
       easing: fabric.util.ease.easeOutCirc

		});
	
	img.animate('top', (newY * gridHeight), {
		  myImg: img,
		  myGameGrid: gameGrid, //to ensure doesn't add if I've just restarted the game
//	      onChange: function() {
//	    	  canvas.renderAll();
//	      },
          onComplete: function() {
  	  			this.myImg.opacity = 0;
      	  		canvas.remove(this.myImg);

          },
       duration: flyawaySpeed,
       easing: fabric.util.ease.easeOutCirc

		});
	
};

function nextToAlreadyCollect(x, y){
	for(var i =0; i < potentialCollectables.length; i += 1){
		var col = potentialCollectables[i];
		var disX = Math.abs(col[0] - x);
		var disY = Math.abs(col[1] - y);
		if(Math.min(disX,disY) == 0 &&  Math.max(disX,disY) <= 1)
			return true;
	}
	return false;
}

Block.prototype.reset = function() {
	if(this.oldStrength == undefined)
		this.resistance = this.origStrength;
	else
		this.resistance = this.oldStrength;
	if(debugMode && this.owner != null)
		this.owner.textGrid[this.myX][this.myY] = this.type + "." + this.resistance;
};


Block.prototype.resetGrid = function(grid,x,y) {
	this.ownerGrid = grid;
	this.myX = x;
	this.myY = y;
};

Block.prototype.rotatePoint = function(clockwise) {
	if(this.pointX != 0){
		this.pointY =  this.pointX * clockwise;
		this.pointX = 0;
	}
	else if(this.pointY != 0){//right to down
		this.pointX =  -this.pointY * clockwise;
		this.pointY = 0;
	}

};

