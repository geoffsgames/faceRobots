"use strict";
//Blinder/////////////////////////////////////
var dontScrambleRotations = true;


Scrambler.prototype = Object.create( MagicBlock.prototype );


function Scrambler(type, ownerGrid, ownerImage,  owner, myX, myY, offsetX, offsetY, pointX, pointY){
	MagicBlock.prototype.setup.call(this, type, ownerGrid, ownerImage,  owner, myX, myY, offsetX, offsetY, pointX, pointY);
}

Scrambler.prototype.activateMagicEffect = function(){
	this.victim.scramble(this);
}

Scrambler.prototype.clearAway = function(explode) {
	if(this.victim != null)
		this.victim.unscramble();
	this.victim = null;
	Block.prototype.clearAway.call(this,explode);
		
};