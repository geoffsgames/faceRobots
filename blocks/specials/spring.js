//Spring/////////////////////////////////////

Spring.prototype = Object.create( Motor.prototype );
var generalScaleX = 1;
var generalScaleY = 1;

var springExtendedImg = document.getElementById("spring");
var springExtendedX = springExtendedImg.width;
var springExtendedY = springExtendedImg.height;
var springExtendedMax = Math.max(springExtendedX, springExtendedY)

function Spring(type, ownerGrid, ownerImage,  owner, myX, myY, offsetX, offsetY, pointX, pointY){
	this.setup(type, ownerGrid, ownerImage,  owner, myX, myY, offsetX, offsetY, pointX, pointY);
}

Spring.prototype.setup = function(type, ownerGrid, ownerImage,  owner, myX, myY, offsetX, offsetY, pointX, pointY){
	this.usePoints = true; //after because I don't want the image to rotate
	this.quantity = 1;
	Motor.prototype.setup.call(this, type, ownerGrid, ownerImage,  owner, myX, myY, offsetX, offsetY, pointX, pointY);
	this.special = true;
	this.resistance = 5;
	this.origStrength = 5;
	this.startingStrength = 5;
	this.canAddMore = true;
	this.isBase = true;
	this.weapon = null;
}

Spring.prototype.getFlyAwayImage = function(){
	var sprImg = this.getSingleImage();
	
	var wall = this.getWall();
	wall.left = (gridWidth / 2);
	wall.top = (gridHeight / 2);
	wall.originX = "center";
	wall.originY = "center";
	
	var group = [wall, sprImg];
	
	return new fabric.Group(group, {
		left: (this.myX * gridWidth) - this.offsetX + (gridWidth / 2),
		top: (this.myY * gridHeight) - this.offsetY + (gridHeight / 2),
		originX:"center",
		originY:"center"});
}


Spring.prototype.increment = function(val){
	if(this.quantity < 6 || val == -1){
		this.quantity = this.quantity + val;
		this.resistance += (val * 2);
	}
	else{
		message.set("text","Can't use more than 6 springs one block!");
		message.set('fill', 'red')
	}
	this.redraw(true);
};

Spring.prototype.saveDamage = function(other) {
	if(this.resistance % 2 == 0){
		this.quantity -= 1;
		this.flyAway();
		this.redraw(true);
	}

};

Spring.prototype.clearAway = function(){
	Block.prototype.clearAway.call(this);
	if(this.weapon != null)
		this.weapon.spring = null;
}


Spring.prototype.checkForWeapons = function(){
	if(this.myX > 0 && this.owner.grid[this.myX - 1] != undefined && this.owner.grid[this.myX - 1][this.myY] != undefined && this.owner.grid[this.myX - 1][this.myY] != null && this.owner.grid[this.myX - 1][this.myY].isWeapon )
		this.weapon = this.owner.grid[this.myX - 1][this.myY];
	if(this.myY > 0 && this.owner.grid[this.myX][this.myY - 1] != undefined && this.owner.grid[this.myX][this.myY - 1] != null && this.owner.grid[this.myX][this.myY - 1].isWeapon )
		this.weapon = this.owner.grid[this.myX][this.myY - 1];
	if(this.myX < this.owner.gridSize - 1 && this.owner.grid[this.myX + 1] != undefined && this.owner.grid[this.myX + 1][this.myY] != undefined && this.owner.grid[this.myX + 1][this.myY] != null && this.owner.grid[this.myX + 1][this.myY].isWeapon )
		this.weapon = this.owner.grid[this.myX + 1][this.myY];
	if(this.myY <  this.owner.gridSize - 1  && this.owner.grid[this.myX][this.myY + 1] != undefined && this.owner.grid[this.myX][this.myY + 1] != null && this.owner.grid[this.myX][this.myY + 1].isWeapon )
		this.weapon = this.owner.grid[this.myX][this.myY + 1];
	
	if(this.weapon != null)
		this.weapon.spring = this;
}


Spring.prototype.orientateImage = function(){

}

Spring.prototype.makeImage = function(type, offsetX, offsetY, pointAngle, pointOffsetX, pointOffsetY){
	
	var group = this.getImageGroup(this.owner == player);
	
	this.image = new fabric.Group(group, {
		left: (this.myX * gridWidth) - offsetX + (gridWidth / 2),
		top: (this.myY * gridHeight) - offsetY + (gridHeight / 2),
		originX:"center",
		originY:"center"});
};

//for inventory
function getBasicSpringGroup(){
	var img = document.getElementById("springBlock");
	
	var chain = new fabric.Image(img, {
		left: gridWidth / 2,
		top: gridHeight / 2,
		originX:"center",
		originY:"center",
		scaleX: gridWidth / img.width,
		scaleY: gridHeight / img.height
	});
	var wall = new fabric.Image(document.getElementById("wall"), {
		left: 0,
		top: 0,
		originX:"left",
		originY:"top",

		width: gridWidth,
		height: gridHeight
	});
	
	return(new fabric.Group([wall, chain], {
		left: 0,
		top: 0,
		originX:"left",
		originY:"top"}));
}

Spring.prototype.getSingleImage = function(){
	var img = document.getElementById("springBlock");
	
	generalScaleX = gridWidth / img.width;
	generalScaleY = gridHeight / img.height;
	
	return new fabric.Image(img, {
		left: 0,
		top: 0,
		originX:"left",
		originY:"top",
		scaleX: gridWidth / img.width,
		scaleY: gridHeight / img.height
	})
}

Spring.prototype.getImageGroup = function(addNumber){
	//pointOffset and offset- see above
	chains = new Array();
	
	for(var i =0; i  < this.quantity; i += 1)
			chains.push(this.getSingleImage());
	
	if(chains.length == 2){
		chains[0].scaleX = generalScaleX/2;
		chains[1].scaleX = generalScaleX/2;
		chains[1].left = gridWidth/2;
	}
	else if(chains.length == 3){
		chains[0].scaleX = generalScaleX/3;
		chains[1].scaleX = generalScaleX/3;
		chains[2].scaleX = generalScaleX/3;
		
		chains[0].scaleY = generalScaleY/2;
		chains[1].scaleY = generalScaleY/2;
		chains[2].scaleY = generalScaleY/2;

		chains[1].top = gridHeight/2;

		chains[1].left = gridWidth * (1/3);
		chains[2].left = gridWidth * (2/3);

	}
	else if(chains.length == 4){
		chains[0].scaleX = generalScaleX/2;
		chains[1].scaleX = generalScaleX/2;
		chains[2].scaleX = generalScaleX/2;
		chains[3].scaleX = generalScaleX/2;
		
		chains[0].scaleY = generalScaleY/2;
		chains[1].scaleY = generalScaleY/2;
		chains[2].scaleY = generalScaleY/2;
		chains[3].scaleY = generalScaleY/2;

		chains[2].top = gridHeight/2;
		chains[3].top = gridHeight/2;
		
		chains[1].left = gridWidth/2;
		chains[3].left = gridWidth/2;

	}
	else if(chains.length == 5){
		chains[0].scaleX = generalScaleX/3;
		chains[1].scaleX = generalScaleX/3;
		chains[2].scaleX = generalScaleX/3;
		chains[3].scaleX = generalScaleX/3;
		chains[4].scaleX = generalScaleX/3;

		
		chains[0].scaleY = generalScaleY/3;
		chains[1].scaleY = generalScaleY/3;
		chains[2].scaleY = generalScaleY/3;
		chains[3].scaleY = generalScaleY/3;
		chains[4].scaleY = generalScaleY/3;

		chains[2].top = gridHeight * (1/3);

		chains[3].top = gridHeight * (2/3);
		chains[4].top = gridHeight * (2/3);

		chains[1].left = gridWidth * (2/3);
		chains[4].left = gridWidth * (2/3);
		
		chains[2].left = gridWidth * (1/3);
	}
	else if(chains.length == 6){
		chains[0].scaleX = generalScaleX/3;
		chains[1].scaleX = generalScaleX/3;
		chains[2].scaleX = generalScaleX/3;
		chains[3].scaleX = generalScaleX/3;
		chains[4].scaleX = generalScaleX/3;
		chains[5].scaleX = generalScaleX/3;

		
		chains[0].scaleY = generalScaleY/2;
		chains[1].scaleY = generalScaleY/2;
		chains[2].scaleY = generalScaleY/2;
		chains[3].scaleY = generalScaleY/2;
		chains[4].scaleY = generalScaleY/2;
		chains[5].scaleY = generalScaleY/2;


		chains[3].top = gridHeight/2;
		chains[4].top = gridHeight/2;
		chains[5].top = gridHeight/2;

		chains[1].left = gridWidth * (1/3);
		chains[4].left = gridWidth * (1/3);
		
		chains[2].left = gridWidth * (2/3);
		chains[5].left = gridWidth * (2/3);

	}
	
	var chain = new fabric.Group(chains, {
		left: (gridWidth / 2),
		top: (gridHeight / 2),
		originX:"center",
		originY:"center",
		width: gridWidth,
		height: gridHeight,
		angle: this.pointAngle});
	
	

	var wall = this.getWall();
	wall.left = (gridWidth / 2);
	wall.top = (gridHeight / 2);
	wall.originX = "center";
	wall.originY = "center";
	
	if(addNumber){
			var text = new fabric.Text((this.motNum + 1) +  "", {
				left: (gridWidth / 2),
				top: (gridHeight / 2),
				fontSize: 20,
				fontFamily: 'Arial',
				originX: 'center',
				originY: 'center',
				fontWeight: 'bold',
				fill: 'red'
			});
			
			message.set('text', 'press ' + (this.motNum + 1) + ' to run your new motor');

			//wall not rotated so don't want the same rotation offset as spring
	
			return [wall, chain, text];
	}
	return [wall, chain];
};

Spring.prototype.pointToKnife = function(dir,knife){
	if(!this.angleAdjusted){//if I've already turned it
		this.pointX = 0;
		this.pointY = 0;
		if(dir == 0)
			this.pointX = -1;
		if(dir == 1)
			this.pointX = 1;
		else if(dir == 2)
			this.pointY = -1;
		else if(dir == 3)
			this.pointY = 1;
		this.getPoints();
		this.redraw(true);
	}
	if(knife.myX - this.pointX == this.myX && knife.myY - this.pointY == this.myY){//if I am actually pointing at it (will usually be the case unless I was already "angleAdjusted" to point at someone else.
		this.weapon = knife; //this is what I will spring forward
	}
};

Spring.prototype.calculatePoints = function(){
	if(this.weapon != null){
		if(this.pointX == 0 && this.pointY == 0)
			this.weapon.calculatePoints()
	}
	else
		Block.prototype.calculatePoints.call(this);

};



Spring.prototype.makeSpringImage = function(){
	var springWidth = 0;
	var springHeight = 0;
	var springLeft = 0;
	var springTop = 0;
	
	if(this.pointX == 1){
		springHeight = gridHeight;
		springLeft = -gridWidth / 2;
		springTop = 0;
	}
	else if(this.pointX == -1){
		springHeight = gridHeight;
		springLeft = gridWidth / 2;
		springTop = 0;
	}
	else if(this.pointY == 1){
		springHeight = gridWidth;
		springLeft = 0;
		springTop = -gridHeight / 2;
	}
	else if(this.pointY == -1){
		springHeight = gridWidth;
		springLeft = 0;
		springTop = gridHeight / 2;
	}
	
	//always horizontal then rotated
	this.springImage = new fabric.Image(springExtendedImg , {
		originX:"center",
		originY:"center",
		scaleX: (springWidth / springExtendedX),
		scaleY: (springHeight / springExtendedY),		
		left: springLeft + this.weapon.image.left,
		top: springTop + this.weapon.image.top,
		angle: this.pointAngle,
	});

};

/**
function SpringTempBlock (owner, myX, myY, oldPiece, spring){ 
	this.owner = owner;
	this.myX = myX;
	this.myY = myY;
	this.oldPiece = oldPiece;
	this.spring = spring;
	this.resistance = 4;
};

SpringTempBlock.prototype.clearAway = function(){
	this.spring.increment(-1)
	this.spring.weapon
}

Spring.prototype.moveAll = function(){
	var oldX = this.weapon.myX;
	var oldY = this.weapon.myY;
	var moving = Motor.prototype.moveAll.call(this);

	if(this.reversing){
		this.tempBlocks.pop();
	}
	else{
		this.owner.grid[oldX][oldY] = new SpringTempBlock(this.owner,oldX,oldY,this.gameGrid[this.owner.myX + oldX][this.owner.myY + oldY], this);
		this.tempBlocks.push(this.owner.grid[oldX][oldY])
	}
};
*/

Spring.prototype.animateSpin = function(){//too fast to actually animate
	var adj = 1;
	
	if(this.movX != this.pointX || this.movY != this.pointY) //reversing
		adj = -1;
	
	if(this.movX != 0){
		var diff = (gridWidth / (maxSpeed / this.movepartsSpeed_fixed)) * adj; //diff is how far the knife  is moving each time, negative if moving left or up
		
		this.springImage.scaleX += (((gridWidth / springExtendedMax) *  (this.movepartsSpeed_fixed / maxSpeed)) * adj)
		this.springImage.left += ((diff / 2) * this.pointX); // div 5 because it's centred
	}
	else if(this.movY != 0){
		var diff = (gridHeight / (maxSpeed / this.movepartsSpeed_fixed)) * adj;
		
		this.springImage.scaleX += ((gridWidth / springExtendedMax)  * (this.movepartsSpeed_fixed / maxSpeed)) * adj;
		this.springImage.top += ((diff / 2) * this.pointY);

	}
};

Spring.prototype.drawGroup = function(){
		this.group = new fabric.Group();
		this.group.angle = 0;
		this.group.originX = "left";
		this.group.originY = "top";
		this.owner.group.remove(this.weapon.image);
		this.group.add(this.weapon.image);
		this.makeSpringImage();
		this.owner.group.add(this.springImage);
		
		this.owner.group.add(this.group);
		this.owner.group.bringToFront();
		
		//canvas.renderAll();
		this.group.selectable = false;
		this.group.bringToFront();
};

Spring.prototype.isWorking = function(){
	return this.weapon != null;
}

Spring.prototype.getDis = function(){
	return this.quantity;
}

Spring.prototype.canMove = function(){
	if(this.weapon == null){ //(if my weapon has been lost at some point)
		message.set("text","Spring has no weapon to spring!");
		message.set('fill', 'red')

		return false;
	}
	return true;
}

Spring.prototype.startMoving = function(){

	


	this.moving = true;
	//canvas.renderAll(); //TODO
	this.neighbours = [this.weapon];
	this.weapon.motor = this;
	this.owner.updateGrid(false);
	
	if(this.chainedMotors == undefined || this.chainedMotors == null){
			this.chainedMotors = this.owner.linkChain(this.myX,this.myY);
			for(var i =0; i < this.chainedMotors.length; i+= 1){
				if(this.chainedMotors[i] != this)
					this.chainedMotors[i].startMoving();
				this.chainedMotors[i].chainedMotors = this.chainedMotors;
				this.chainedMotors[i].chainVisited = false;
			};
	}
	
	this.drawGroup();

	this.movepartsCounter = 0;
	this.movefastCounter = 0;
	this.owner.getOtherRobot().movefastCounter = 0;
	numPlayers += 1;
	
	this.dis = this.quantity;
	this.movX = this.pointX;
	this.movY = this.pointY;
	
	this.disMoved = 0;
	this.disMovedCut = 1;
	this.collided = false;
	var grow = (this.dis * this.movX) + this.weapon.myX;
	if(this.movX == 0)
		grow = (this.dis * this.movY) + this.weapon.myY;
	this.owner.growGrid(grow,grow);
	
	this.owner.actualWidth = gridWidth * this.owner.gridSize;
	this.owner.actualHeight = gridHeight * this.owner.gridSize;

	
	interval = minInt;
	
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
