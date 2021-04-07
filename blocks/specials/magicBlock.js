"use strict";
//MagicBlock - this is the superblock for blocks which have an effect every time you collide with them
//except in the process of damaging them

MagicBlock.prototype = Object.create( Block.prototype );


function MagicBlock(type, ownerGrid, ownerImage,  owner, myX, myY, offsetX, offsetY, pointX, pointY){
	this.setup(type, ownerGrid, ownerImage, owner, myX, myY, offsetX, offsetY, pointX, pointY);

}

MagicBlock.prototype.setup = function(type, ownerGrid, ownerImage,  owner, myX, myY, offsetX, offsetY, pointX, pointY){
	this.usePoints = true; //after because I don't want the image to rotate
	this.backgroundedImage = true;
	Block.prototype.setup.call(this, type, ownerGrid, ownerImage,  owner, myX, myY, offsetX, offsetY, pointX, pointY);
	this.special = true;
	this.isWeapon = true;
	this.isBase = true;
	this.flyAwayRetries = 5;
	this.maxFlyDistance = 15;
	this.victim = null;
	this.resistance = 5;
	this.origStrength = 5;
	this.startingStrength = 5;
	this.weaponStrength = 10;
	this.origWeaponStrength = 10;
	this.isMagic = true;
}



MagicBlock.prototype.magicEffect = function(other) {
	if(this.owner == undefined || this.owner == null || other.owner == undefined || other.owner == null)
		return;
	if(other.owner.alreadyMagiced)
		return;
	this.victim = other.owner;
	
	//for the purpose of AI - so that, after blinding/scrambling opponent I move on to trying to stab them with another weapon
	this.weaponStrength = 0; 
	this.owner.findWeapons();
	
	//can't magic again this shot, can go back and return to magic again though
	this.victim.alreadyMagiced = true;
	this.activateMagicEffect();
}

MagicBlock.prototype.loseEffect = function(){
	this.weaponStrength = 10;
	this.owner.findWeapons();

}

//shouldn't happen as special effects determined by subtypes
MagicBlock.prototype.activateMagicEffect = function(){
	alert("A collectable has not had its special effect defined: " + this)
}