"use strict";
//Fan////////////////////////////////

Fan.prototype = new Block();        // Here's where the inheritance occurs 
Fan.prototype.constructor=Fan;       // Otherwise instances of Cat would have a constructor of Mammal 


function Fan(type, ownerGrid, ownerImage,  owner, myX, myY, offsetX, offsetY, pointX, pointY){
	this.usePoints = true;
	Block.prototype.setup.call(this, type, ownerGrid, ownerImage,  owner, myX, myY, offsetX, offsetY, pointX, pointY);
	this.special = true;
	this.isBase = false;
	this.flyAwayRetries = 5;
	this.maxFlyDistance = 15;
	if(this.owner != null)
		this.owner.fans.add(this);

}


Fan.prototype.updateFanSpeeds = function(incr){
	if(this.owner == null)
		return;
	var side = this.pointAngle / 90;//what WOULD my side be if I was facing 0
	side = side - this.owner.facing;
	if(side < 0)
		side = side + 4;
	this.owner.fasterSpeeds[side] += incr;
};

Fan.prototype.clearAway = function(explode){
	if(this.owner != null)
		this.owner.fans.delete(this);
	Block.prototype.clearAway.call(this, explode);
}

