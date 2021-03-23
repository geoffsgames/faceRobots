//Knife//////////////////////////////////////////////////////////////////////////////////////////////


Crystal.prototype = new Block();        // Here's where the inheritance occurs 
Crystal.prototype.constructor=Crystal;       // Otherwise instances of Cat would have a constructor of Mammal 

function Crystal(type, ownerGrid, ownerImage,  owner, myX, myY, offsetX, offsetY, pointX, pointY){
	this.setup(type, ownerGrid, ownerImage, owner, myX, myY, offsetX, offsetY, pointX, pointY);

}

Crystal.prototype.setup = function(type, ownerGrid, ownerImage,  owner, myX, myY, offsetX, offsetY, pointX, pointY){
	Block.prototype.setup.call(this, type, ownerGrid, ownerImage,  owner, myX, myY, offsetX, offsetY, pointX, pointY);
	this.resistance = 10;
	this.origStrength = this.resistance;
	this.flyAwayRetries = 5;
}

