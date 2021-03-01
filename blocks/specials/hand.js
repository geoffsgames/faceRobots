//Hand - steals my inventory. Found on some Thiefbots/////////////////////////////////////

//cumulative probabilities (i.e. applied sequentially)
var hasNothingProb = 0.05;
var hasKnifeProb = 0.9;
var hasTwoKnivesProb = 0.25;
var hasThreeKnivesProb = 0.25;

var hasSpecialsProb = 0.8;
var hasTwoSpecialsProb = 0.25;
var hasThreeSpecialsProb = 0.25;


Hand.prototype = Object.create( MagicBlock.prototype );


function Hand(type, ownerGrid, ownerImage,  owner, myX, myY, offsetX, offsetY, pointX, pointY){
	this.usePoints = true; //after because I don't want the image to rotate
	MagicBlock.prototype.setup.call(this, type, ownerGrid, ownerImage,  owner, myX, myY, offsetX, offsetY, pointX, pointY);
}

Hand.prototype.specialEffect = function(){
	if(this.victim == player){//remove all my inventory
		message.setText("Thiefbot has robbed you!");
		message.setColor('blue');
		messageTimer = 10;

		for(var i =0; i < player.inventoryImages.length; i+= 1){
			canvas.remove(player.inventoryText[index]);
			canvas.remove(player.inventoryImages[index]);
		}
		while(inventoryImages.length > 0){
			player.inventoryImages.pop();
			player.inventoryTypes.pop();
			player.inventoryQuants.pop();
			player.inventoryText.pop();
		}
		player.selectedType = undefined;
	}
	else if(this.owner == player){ //aquire random selection of blocks
		if(Math.seededRandomDouble() > hasNothingProb){
			var numBlocks = Math.seededRandom(1,5);
			if(Math.seededRandomDouble() < hasKnifeProb){
				if(Math.seededRandomDouble() < hasTwoKnivesProb){
					if(Math.seededRandomDouble() < hasThreeKnivesProb){
						
					}
				}
			}
			if(Math.seededRandomDouble() < hasSpecialsProb){
				if(Math.seededRandomDouble() < hasTwoSpecialsProb){
					if(Math.seededRandomDouble() < hasThreeSpecialsProb){
						
					}
				}
			}
		}

	}
}

Hand.prototype.makeImage = function(type,offsetX,offsetY,pointAngle,pointOffsetX,pointOffsetY){
	Hand.prototype.setup.call(this,type,offsetX,offsetY,pointAngle,pointOffsetX,pointOffsetY);	
	this.closedHand = this.makeImage("closedHand",offsetX,offsetY,pointAngle,pointOffsetX,pointOffsetY);

}
