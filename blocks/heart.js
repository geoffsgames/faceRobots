//Heart//////////////////////////////////////////////////////////////////////////////////////////////


Heart.prototype = new Block();        // Here's where the inheritance occurs 
Heart.prototype.constructor=Heart;       // Otherwise instances of Cat would have a constructor of Mammal 

function Heart(type, ownerGrid, ownerImage,  owner, myX, myY, offsetX, offsetY, pointX, pointY){
	Block.prototype.setup.call(this, type, ownerGrid, ownerImage,  owner, myX, myY, offsetX, offsetY, pointX, pointY);
	this.heart = true;
	this.currentlyRotating = false;
	if(this.owner != null)
		this.owner.heart = this;
}

Heart.prototype.destroy = function(other) {
	
	Block.prototype.destroy.call(this, other);
	if(this.owner != null){
		this.owner.die();
	}
		
};


Heart.prototype.makeImage = function(type,offsetX,offsetY,pointAngle,pointOffsetX,pointOffsetY){
	
	//offset because the source image is taller than 40 and should overlap
	var tallImgOffset = gridHeight;
	
	var startFace = null;
	if(this.owner == null)//if owner is null assume player editing
		startFace = player.startFace;
	else
		startFace = this.owner.startFace;
	
	var myAngle = 0;
	
	//if I reset before I've finished rotating for some reason stick head on side for rotating back (shouldn't really happen but leave in just in case)
	if(this.owner != undefined && this.owner != null){
		myAngle = this.owner.totalRotate;
		if(myAngle < 0)
			myAngle = 360 + this.owner.totalRotate;
	}
	
//	//pointOffset and offset- see above
	var img = new fabric.Image(document.getElementById(startFace), {
		//90 degrees = +gridWidth + gridHeight
		//180 degrees = +gridHeight * 2
		//270 degrees = -gridWidth + gridHeight
		left: 0,
		top: 0,
	});
	


	this.image = new fabric.Group([], {

		width: Math.round(1.25 * gridWidth),
		height: Math.round(1.875 * gridHeight), //because image is tall and should overlap
		left: (this.myX * gridWidth) - offsetX + (gridWidth / 2), //+ pointOffsetX,
		top: (this.myY * gridHeight) - offsetY - tallImgOffset + (gridHeight / 2),//
		originX: "center",
		orignY: "center"

	});

	
	this.image.add(img);
	img.originX = "center";
	img.originY = "center";
	img.left = 0;
	img.top = 0;
	img.angle = myAngle;
	
	this.image.setCoords();
	
//	this.image = new fabric.Ellipse({
//		
//		
//		left: (this.myX * gridWidth) - offsetX + (gridWidth / 2), //+ pointOffsetX,
//		top: (this.myY * gridHeight) - offsetY - tallImgOffset + (gridHeight / 2),//
//		originX: "center",
//		orignY: "center",
//		rx: gridWidth/2,
//		fill: 'yellow',
//		line: 'black',
//		ry: gridHeight * 0.75, //because image is tall and should overlap
//		angle: pointAngle
//	});
	
	if(this.owner != undefined && this.owner != null && this.owner.heartCurrentlyRotating){
		this.owner.heartCurrentlyRotating = false;
		//console.log("rotating in make heart" + new Date().getTime());
		this.rotateBackAnimation();
	}
};

Heart.prototype.rotateBackAnimation = function(){
	if(this.owner.heartCurrentlyRotating)
		return;
	

	
	var rotateAngle = 360 - this.owner.totalRotate;
	if(rotateAngle > 360)
		rotateAngle = -this.owner.totalRotate;
	
	this.owner.heartCurrentlyRotating = true;
	if(rotateAngle == 360){
    	this.owner.heartCurrentlyRotating = false;
		this.owner.totalRotate = 0;
    	this.owner.resetFace(this.owner.directionFaces[this.owner.offsetDir]);
		return;
	}
	
	
	//always go shortest way
	if(rotateAngle == 270)
		rotateAngle = -90;
	else if(rotateAngle == 180)//random one way or another
		rotateAngle = ((Math.round(Math.maybeSeededRandom(0, 1)) * 2) - 1) * 180;
	
	//rotate
	this.image._objects[0].animate('angle', makeAnimateString(rotateAngle),{
		owner : this.owner,
		image : this,
        onComplete: function(){
        	this.owner.heartCurrentlyRotating = false;
			this.owner.totalRotate = 0;
        	this.owner.resetFace(this.owner.directionFaces[this.owner.offsetDir]);
        },
        duration: initialInterval,
        easing: fabric.util.ease.easeInSine
	});
	


}

Heart.prototype.flyAway = function() {
	var face;
	
	//offset because the source image is taller than 40 and should overlap
	var tallImgOffset = Math.round(14 * (gridHeight / 40));
	
	//pointOffset and offset- see above	land.enemiesLeft = 0;

	this.image = new fabric.Image(face, {
		left: (this.myX + this.owner.myX) * gridWidth,
		top: (this.myY + this.owner.myY) * gridHeight - tallImgOffset,
		width: gridWidth,
		height: Math.round(1.5 * gridHeight), //because image is tall and should overlap
	});
	
	canvas.add(this.image);
};


