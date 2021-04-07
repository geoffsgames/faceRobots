"use strict";
//Knife//////////////////////////////////////////////////////////////////////////////////////////////


Knife.prototype = new Block();        // Here's where the inheritance occurs 
Knife.prototype.constructor=Knife;       // Otherwise instances of Cat would have a constructor of Mammal 
function Knife(type, ownerGrid, ownerImage,  owner, myX, myY, offsetX, offsetY, pointX, pointY){
	this.setup(type, ownerGrid, ownerImage, owner, myX, myY, offsetX, offsetY, pointX, pointY);
}

Knife.prototype.setup = function(type, ownerGrid, ownerImage,  owner, myX, myY, offsetX, offsetY, pointX, pointY){
	this.usePoints = true;
	this.isWeapon = true;
	//TODO - weaponStrength supersedes isWeapon as for non weapons will = 0, but keep for now to avoid recoding
	Block.prototype.setup.call(this, type, ownerGrid, ownerImage,  owner, myX, myY, offsetX, offsetY, pointX, pointY);
	this.forwardStrength = 2;
	this.sideStrength = 1;
	this.startingStrength = 5;
	this.resistance = 5;
	this.origStrength = 5;
	this.isBase = false;
	this.flyAwayRetries = 5;
	this.maxFlyDistance = 15;
	this.weaponStrength = 1;
	this.origWeaponStrength = 1;
}

Knife.prototype.clearAway = function(explode) {
	Block.prototype.clearAway.call(this, explode);
	if(this.owner != null){
		this.owner.lostKnife(this);
	}
};


