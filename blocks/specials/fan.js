"use strict";
//Fan////////////////////////////////

Fan.prototype = new Block();     
Fan.prototype.constructor=Fan; 


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
	//adjust for way actually facing
	side = side - this.owner.facing;
	if(side < 0)
		side = side + 4;
	this.owner.fasterSpeeds[side] += incr;
};

Fan.prototype.clearAway = function(explode){
	//so owner updates speed
	if(this.owner != null)
		this.owner.fans.delete(this);
	Block.prototype.clearAway.call(this, explode);
}

