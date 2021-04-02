"use strict";
//Blinder/////////////////////////////////////

Blinder.prototype = Object.create( MagicBlock.prototype );

var blindedCounterMin = 100;
var blindedCounterMax = 200;


function Blinder(type, ownerGrid, ownerImage,  owner, myX, myY, offsetX, offsetY, pointX, pointY){
	this.bubbles = [];
	MagicBlock.prototype.setup.call(this, type, ownerGrid, ownerImage,  owner, myX, myY, offsetX, offsetY, pointX, pointY);
}



Blinder.prototype.activateMagicEffect = function(){
	this.victim.blind(this);
}

//start the special effect - fill whole screen with black circles
Blinder.prototype.fillWithBubbles = function(){
	this.bubbles = [];
	var numBubbles = Math.maybeSeededRandom(15,30);
	var circSize = Math.min(displayWidth / Math.sqrt(numBubbles), displayHeight / Math.sqrt(numBubbles));
	
	var numRows = displayWidth / circSize;
	var numCols = displayHeight / circSize;
	
	var xPos, yPos;
	this.numBubbles = 0;
	for(var x = 0; x < numRows; x++){
		xPos = Math.round(x * circSize + (circSize * Math.maybeSeededRandom(-0.5,0.5)));
		for(var y = 0; y < numCols; y++){
			yPos = Math.round(y * circSize + (circSize * Math.maybeSeededRandom(-0.5,0.5)))
			this.addCircle(xPos, yPos, circSize, false);
		}
	}
}

Blinder.prototype.addCircle = function(xPos, yPos, circSize, extraBubble){
	if(extraBubble)
		this.numExtraBubbles++;
	else
		this.numExtraBubbles = 0;
	var circ = new fabric.Circle({
		  left: xPos,
		  top: yPos,
		  radius: Math.round(Math.maybeSeededRandom(0.1,2) * circSize),
		  fill: 'black',
		  originX: 'center',
		  originY: 'center',
		  opacity: 1,
		  hasControls: false
		});
	circ.counter = Math.round(Math.maybeSeededRandom(1000,Math.max(5000, 50000 - (this.numExtraBubbles * 5000)  ) ));
	circ.animate('opacity', 0, {
		duration: Math.round(Math.maybeSeededRandom(1000,Math.max(5000, 50000 - (this.numExtraBubbles * 5000)  ) )),
		owner: this,
		image: circ,
		onComplete: function(){
			  this.owner.numBubbles --;
			  canvas.remove(this.image);
        }
	});
	this.bubbles.push(circ);
	canvas.add(circ);
	this.numBubbles++;

}

