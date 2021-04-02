"use strict";
//Obstacle/////////////////////////////////////////////////////////////////////////////////////


Obstacle.prototype = new Block();        // Here's where the inheritance occurs 
Obstacle.prototype.constructor=Obstacle;       // Otherwise instances of Cat would have a constructor of Mammal 
function Obstacle(type, ownerGrid, ownerImage,  owner, myX, myY, offsetX, offsetY, pointX, pointY){
	this.usePoints = true;
	Block.prototype.setup.call(this, type, ownerGrid, ownerImage,  owner, myX, myY, offsetX, offsetY, pointX, pointY);
	this.resistance = 10;
	this.startingStrength = 10;
}

Obstacle.prototype.drawBackground = function() {
	context.clearRect(this.image.left,this.image.top,gridWidth,gridHeight);
};


Obstacle.prototype.saveDamage = function(){
	var found = false;
	for(var i = land.changedBlocks.length - 1; i >= 0 && !found; i-= 1){
		if(land.changedBlocks[i][0] == this.myX && land.changedBlocks[i][1] == this.myY){
			land.changedBlocks[i][2] = this.resistance;
			found = true;
		}
	}
	if(!found)
		land.changedBlocks.push([this.myX, this.myY, this.resistance]);
};

//if recorded damage but that was in error because found out later another block blocked knife from moving in on me (person.jumpBack() activated)
Obstacle.prototype.reset = function() {
	var found = false;
	Block.prototype.reset.call(this);
//	for(var i = land.changedBlocks.length - 1; i >= 0 && !found; i-= 1){
//		if(land.changedBlocks[i][0] == this.myX && land.changedBlocks[i][1] == this.myY){
//			land.changedBlocks[i][2] = this.oldStrength;
//			if(this.oldStrength == this.origStrength)
//				land.changedBlocks.splice(i,1);
//			found = true;
//		}
//	}
};


Obstacle.prototype.draw = function(type,offsetX,offsetY,pointAngle,pointOffsetX,pointOffsetY){
	this.makeImage(type,offsetX,offsetY,pointAngle,pointOffsetX,pointOffsetY);
	this.drawImage();
};

Obstacle.prototype.drawImage = function(){
	if(this.ownerImage == canvas){//moved to foreground
		this.image = new fabric.Image(document.getElementById("obstacle"), {
			originX: "center",
			originY: "center",
			left: this.imgLeft,
			top: this.imgTop,
			width: this.imgWidth,
			height: this.imgHeight,
			angle: this.pointAngle
		});	
		canvas.add(this.image);
		this.drawBackground();
	}
	else{//still in background
		context.save();
	    context.translate(this.imgLeft + (this.imgWidth / 2),this.imgTop + (this.imgHeight/2));
		context.rotate(this.pointAngle*Math.PI/180);
		this.ownerImage.drawImage(this.image,-(this.imgWidth / 2),-(this.imgHeight / 2),this.imgWidth,this.imgHeight);
		context.restore();
	}
};

Obstacle.prototype.makeImage = function(type,offsetX,offsetY,pointAngle,pointOffsetX,pointOffsetY){
	this.image = document.getElementById(type);
	this.imgWidth = gridWidth * Math.seededRandomDouble(1, 1.2);
	this.imgHeight = gridWidth * Math.seededRandomDouble(1, 1.2);
	this.imgLeft = (this.myX * gridWidth) - offsetX + (gridWidth/ 2);
	this.imgTop = (this.myY * gridHeight) - offsetY + (gridHeight/2);

	
};


Obstacle.prototype.showDamage = function(){
	if(this.ownerImage != canvas){//clear from background canvas and add to foreground canvas
		this.ownerImage = canvas;

		this.image = new fabric.Image(document.getElementById("obstacle"), {
			originX: "center",
			originY: "center",
			left: this.imgLeft,// + pointOffsetX,
			top: this.imgTop,// + pointOffsetY,
			width: this.imgWidth,
			height: this.imgHeight,
			angle: this.pointAngle
		});	
		canvas.add(this.image);
		this.drawBackground();
	};
	var damageExtent = this.origStrength / Math.max(this.resistance,1); 
	this.image.angle = this.pointAngle + ((Math.maybeSeededRandom(-2, 2)) * damageExtent);
	this.image.left = this.imgLeft + (Math.maybeSeededRandom(-1, 1)) * damageExtent;
	this.image.top = this.imgTop + (Math.maybeSeededRandom(-1, 1)) * damageExtent;

};

Obstacle.prototype.directionMatches = function(movX, movY) {
	return false;
};
