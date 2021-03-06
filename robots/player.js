Player.prototype = new Person();   
Player.prototype.constructor=Player;
var editBlocks = new Array();

var curRival = null;

var edgeDetectDis = 3;//calculate landscape of adjacent grid when get this close to edge of current grid

//stair animation
var stairRotations = 5;
var stairDuration = 1024;

    
function Player(myX, myY, facing) {
	this.deadFace = "goodfaceDead";
	this.mainFace = "goodface";
	this.startFace = this.mainFace;
	this.hurtFace = "goodfaceHurt";
	this.directionFaces = ["goodfaceLeft", "goodfaceUp", "goodfaceRight", "goodfaceDown"];
	if(myX != undefined)
		this.setup(myX, myY, facing);
	this.enlarged = false;
	this.willRotate = 0;
	

};

Player.prototype.stop = function(){
	this.movX = 0;
	this.movY = 0;
	this.activateEditMode();
};

//add a block by clicking on a red add square, (i.e. adding a block in edit mode)
Player.prototype.convertAddPlace = function(addPlace){
	if(this.selectedType != undefined){
		var type;
		if(playingBack)
			type = this.selectedType;
		else
			type = this.inventoryTypes[this.selectedType];
		var newX = addPlace.gridX;
		var newY = addPlace.gridY;
		clearMarkers(this.rects); //clear the red add squares
		this.addPiece(newX, newY, type);
		if(newX < 0 || newY < 0){
			newX += 1;
			newY += 1;
		}

		//draw new block on canvas (not on robot group itself yet - that'll be reassembled when start moving)
		addGridSquare(newX + this.myX, newY + this.myY, type, gameGrid, canvas, null,0,0,this.grid[newX][newY].pointX,this.grid[newX][newY].pointY);
		var block = gameGrid[newX + this.myX][newY + this.myY].image;
		block.lockMovementX = true;
		block.lockMovementY = true;
		block.hasControls = false;
		block.isDeletePlace = true;
		gameGrid[newX + this.myX][newY + this.myY].isDeletePlace = true;
		block.myX = newX + this.myX;
		block.myY = newY + this.myY;
		
		this.totalNumBlocks += 1;
			
		this.stoppedBlocks.push(block);
		this.addAllMarkers();//redo markers - markers go in every place adjacent to existing blocks so with new block need redoing
		if(!playingBack){
			this.inventoryQuants[this.selectedType] -= 1;
			if(this.inventoryQuants[this.selectedType] == 0){
				this.removeFromInventory(this.selectedType);
			}
			else{
				this.recordInventoryNum(this.inventoryQuants[this.selectedType], this.selectedType);
			}
		}
	}
};

Player.prototype.deselected = function(){
	if(this.rects == undefined)
		return;
	selectedBlock = null;
	
	for(var i = 0, len = editBlocks.length; i < len; i+= 1)
		editBlocks[i].selectable = true;
	for(var i = 0, len = this.rects.length; i < len; i+= 1)
		this.rects[i].selectable = true;

};

Player.prototype.finishRotating = function(){
	this.willFinishRotating = this.group.angle;
	if(this.willFinishRotating % 90 != 0){
		this.willRotate = 0;
		this.rotation = 0;
	}
}

//rotate face back to upright if needed and not in the middle of rotation
Player.prototype.maybeRotateHeart = function(){
	if(this.willFinishRotating != -1 && !this.heartCurrentlyRotating){
		if(this.willFinishRotating != this.group.angle){ //either haven't rotated yet or already finished rotating, either way to be safe leave it til next turn to adjust
			this.heart.rotateBackAnimation();
			this.willFinishRotating = -1;
		}
		else{
			this.willFinishRotating = 999;
		}
	}
}

Player.prototype.finishEditBlockRotation = function(){	
	if(selectedBlock == null || selectedBlock.initialAngle == undefined || selectedBlock.angle == selectedBlock.initialAngle)
		return;
	
	//displaying
	selectedBlock.angle = Math.round(selectedBlock.angle / 90) * 90;
	
	//change the angle actually on my robot
	var block = this.grid[selectedBlock.myX - this.myX][selectedBlock.myY - this.myY];
	block.isDeletePlace = true;
	block.angleAdjusted = true;
	block.pointX = 0;
	block.pointY = 0;
	if(selectedBlock.angle == 0)
		block.pointX = -1;
	else if(selectedBlock.angle == 90)
		block.pointY = -1;
	else if(selectedBlock.angle == 180)
		block.pointX = 1;
	else if(selectedBlock.angle == 270)
		block.pointY = 1;


};

Player.prototype.redoSpringBlock = function(oldBlock,gameBlock){
	var newBlock = new fabric.Group(gameBlock.getImageGroup(false), {
		left: oldBlock.left,
		top: oldBlock.top,
		originX:"center",
		originY:"center"});
	//canvas.renderAll();
	canvas.remove(oldBlock);
	//canvas.renderAll();
	//canvas.add(newBlock);
	newBlock.selectable = true;
	newBlock.hasControls = false;
	return newBlock;
};

Player.prototype.deleteBlock = function(block, mustDelete){
	var x = block.myX;
	var y = block.myY;
	var tempBlock = this.grid[x - this.myX][y - this.myY];
	
	
	if(tempBlock.heart){
		message.setText("Can't modify heart!");
		message.setColor('red');
		tempBlock.selectable = false;
		return;//can't delete heart
	}
	if(!mustDelete && tempBlock.usePoints && canEditRotations){//will rotate
		//make all the others unselectable
		selectedBlock = block;
		for(var i = 0, len = editBlocks.length; i < len; i+= 1){
			if(editBlocks[i] != selectedBlock)
				editBlocks[i].selectable = false;
		}
		for(var i = 0, len = this.rects.length; i < len; i+= 1)
			this.rects[i].selectable = false;

		message.setText("");
		block.bringToFront();
		selectedBlock.initialAngle = selectedBlock.angle;
	}
	else if(tempBlock.canAddMore){ //for items like springs where more than one block can be added to a single position
		var quantDeleted = 0;
		if(!mustDelete){
			if(this.inventoryTypes[this.selectedType] == tempBlock.type){
				tempBlock.increment(1);
			}
			else{ //if have other item selected remove all and reset
				quantDeleted = tempBlock.quantity;
				tempBlock.quantity = 0;
			}

		}
		else{
			quantDeleted = 1;
			tempBlock.increment(-1);
		}
		
		if(tempBlock.quantity == 0){
			this.deleteBlock2(tempBlock, block, x, y);
			quantDeleted -= 1; //because 1 will already be added in deleteBlock2
		}
		else{
			var newBlock = this.redoSpringBlock(block,tempBlock);
			canvas.add(newBlock);
			editBlocks.push(newBlock);
			newBlock.myX = block.myX;
			newBlock.myY = block.myY;
	
			block = newBlock;
			this.stoppedBlocks.push(block);
			block.isDeletePlace = true;
			selectedBlock = block;
			this.inventoryQuants[this.selectedType] -= 1;
			if(this.inventoryQuants[this.selectedType] == 0){
				this.removeFromInventory(this.selectedType);
			}
			else{
				this.recordInventoryNum(this.inventoryQuants[this.selectedType], this.selectedType);
			}
			

		}
		for(var i =0; i < quantDeleted; i+= 1) //in case deleted multiple copies of this block or deleted this block without called deleteBlock2 (i.e. wasn't completely removed)
			this.addBlockToInventory(tempBlock.type);
	}
	else{ //not an item like a spring where multiple blocks can be added to one position
		this.deleteBlock2(tempBlock, block, x, y);
	
	}
	if(this.spring != null)
		this.spring.weapon = this;
};

//method that actually does the deleting
Player.prototype.deleteBlock2 = function(tempBlock, block, x, y){
	player.weapons.delete(this.grid[x - this.myX][y - this.myY]);

	
	for(var i = 0, len = editBlocks.length; i < len; i+= 1){
		if(editBlocks[i] != selectedBlock)
			editBlocks[i].selectable = false;
	}
	for(var i = 0, len = this.rects.length; i < len; i+= 1)
		this.rects[i].selectable = false;

	selectedBlock = null;
	if(tempBlock.type == "motor"){ //deleting a motor
		
		newMots = player.motors;
		var deletedMot = false
		for(var i = 0; i < newMots.length && !deletedMot; i+= 1){
			var mot = newMots[i];
			if(mot != null && (mot.myX == (x - this.myX) && mot.myY == (y - this.myY))){//found the motor that we want to delete
				newMots = newMots.splice(i,i);
				deletedMot = true;
			}
		}
		if(!deletedMot){
			//TODO figure out how to handle properly
			alert("motor to be deleted not found");
		}
		player.motors = newMots
	}
	this.grid[x - this.myX][y - this.myY] = null;
	if(debugMode)
		this.textGrid[x - this.myX][y - this.myY] = 0;
	this.totalNumBlocks -= 1;
	if(playingBack || !this.areGaps(x - this.myX,y - this.myY)){
		//can delete
		clearMarkers(this.rects);
		canvas.remove(block);
		gameGrid[x][y] = 1;
		this.addAllMarkers();
		
		this.addBlockToInventory(tempBlock.type);
	}
	else{//if it would leave a gap = can't remove replace block
		this.grid[x - this.myX][y - this.myY] = tempBlock;
		this.totalNumBlocks += 1;
	}
	//reset gap checking
	for(var ix = 0; ix < this.gridSize; ix += 1){
		for(var iy = 0; iy < this.gridSize; iy += 1){
			if(this.grid[ix] != undefined && this.grid[ix][iy] != undefined && this.grid[ix][iy] != null)
				this.grid[ix][iy].checkedForGaps = false;
		}
	}

};


Player.prototype.checkCollision = function() {
	if(Person.prototype.checkCollision.call(this)) //if jumped back
		return true;
	//highlight stairs red when over them
	if(this.stairsCollide != null && activatedStairs == null){
		activatedStairs = this.stairsCollide;
		var background = new fabric.Rect({
			  left: activatedStairs.x * gridWidth,
			  top: activatedStairs.y * gridHeight,
			  fill: 'red',
			  width: gridWidth * 2,
			  height: gridHeight * 2,
			});	
		canvas.add(background);
		activatedStairs.background = background;
		var zindex = canvas.getObjects().indexOf(activatedStairs.image);
		background.moveTo(zindex - 1);
		canvas._objects[canvas._objects.length - 1].selectable = false;

	}
	else if(this.stairsCollide == null && activatedStairs != null){
		canvas.remove(activatedStairs.background);
		activatedStairs = null;
	}
	
	return false;
};


Player.prototype.hasWeaponInInventory = function(){
	for(var i =0; i < this.inventoryTypes.length; i += 1){
		if(this.inventoryTypes[i] != "block")
			return true;
	}
}

Player.prototype.addBlockToInventory = function(type){
	var scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
	var scrollTop = window.pageYOffset || document.documentElement.scrollTop;

	
	var ind = -1;
	for(var i =0; i < this.inventoryTypes.length && ind == -1; i += 1){
		if(this.inventoryTypes[i] === type)
			ind = i;
	}
	if(ind == -1){
		//pointOffset and offset- see above
		var img = null;
		if(type == "spring"){
			img = getBasicSpringGroup();
			img.left = ((this.inventoryTypes.length + 0.5) * gridWidth) + scrollLeft;
			img.top = (gridHeight * 0.5) + scrollTop;
		}
		else{
			img = new fabric.Image(document.getElementById(type), {
				left: ((this.inventoryTypes.length + 0.5) * gridWidth) + scrollLeft,
				top: (gridHeight * 0.5) + scrollTop,
				width: gridWidth,
				height: gridHeight
			});
		}
		
		img.borderColor = 'red';
		img.strokeWidth = 5;

		img.inventory = this.inventoryTypes.length;
		img.selectable = true;
		canvas.add(img);
		img.lockScalingX = img.lockScalingY = img.lockMovementX = img.lockMovementY = true;
		img.hasControls = false;
		ind = this.inventoryTypes.length;
		this.recordInventoryNum(1, ind);
		this.inventoryImages.push(img);
		this.inventoryTypes.push(type);
		this.inventoryQuants.push(1);
		
		//reset del image to end of inventory
		delImg.left = ((this.inventoryTypes.length + 1.5) * gridWidth) + scrollLeft;
		delImg.top = (gridHeight * 0.5) + scrollTop;
		delImg.setCoords();
	}
	else{
		this.inventoryQuants[ind] += 1;
		this.recordInventoryNum(this.inventoryQuants[ind], ind);
	}
};

Player.prototype.removeFromInventory = function(index){
	
	canvas.remove(this.inventoryText[index]);
	canvas.remove(this.inventoryImages[index]);
	for(var i = index; i < this.inventoryTypes.length - 1; i += 1){
		this.inventoryImages[i] = this.inventoryImages[i + 1];
		this.inventoryTypes[i] = this.inventoryTypes[i + 1];
		this.inventoryQuants[i] = this.inventoryQuants[i + 1]
		this.inventoryText[i] = this.inventoryText[i + 1];
		this.inventoryText[i].left -= gridWidth;
		this.inventoryImages[i].left -= gridWidth;
		this.inventoryImages[i].inventory -= 1;
		this.inventoryImages[i].setCoords(); 		
		
		

	}
	this.inventoryImages.pop();              		
	this.inventoryTypes.pop();               		
	this.inventoryQuants.pop();
	this.inventoryText.pop();
	this.selectedType = undefined;
	
	//reset del image to end of inventory
	delImg.left = ((this.inventoryTypes.length + 1.5) * gridWidth) + (window.pageXOffset || document.documentElement.scrollLeft);
	delImg.top = (gridHeight * 0.5) + (window.pageYOffset || document.documentElement.scrollTop);
	delImg.setCoords();
};

Player.prototype.recordInventoryNum = function(num, ind){
	var scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
	var scrollTop = window.pageYOffset || document.documentElement.scrollTop;

	
	var text = new fabric.Text("" + num, { left: (gridWidth * (ind + 1)) - 10 + scrollLeft, top: gridHeight - 10 + scrollTop, fontSize: 20, stroke: '#ff0000' });
	if(ind < this.inventoryText.length){
		canvas.remove(this.inventoryText[ind]); //clear out old text to replace
		this.inventoryText[ind] = text;
	}
	else
		this.inventoryText.push(text);
	canvas.add(text);
	text.selectable = false;
};

Player.prototype.selectFromInventory = function(index){
	this.selectedType = index;
};

Player.prototype.updateGrid = function(clear){
	if(!(this.rects != undefined && this.rects != null)) //if I'm not in edit mode
		Person.prototype.updateGrid.call(this,clear);
};

//will attempt to reselect inventory item I had selected before but, if it's not available will just select last item in inventory
//if none available will select delImg
Player.prototype.tryToSelectWhatIHadSelectedBefore = function(lastSelectedInd){
	if(this.inventoryImages.length == 0)
		return delImg;
	
	while(lastSelectedInd >= this.inventoryImages.length)
		lastSelectedInd -= 1;
	return this.inventoryImages[lastSelectedInd];
}

Player.prototype.activateEditMode = function(){
	this.recreateable = false;
	canvas.setActiveObject(delImg);
	this.damagedBlocks = new Array();

	//add the delete icon to the inventory
	delImg.left = ((this.inventoryTypes.length + 1.5) * gridWidth) + (window.pageXOffset || document.documentElement.scrollLeft);
	delImg.top = (gridHeight * 0.5) + (window.pageYOffset || document.documentElement.scrollTop);
	delImg.setCoords();
	canvas.add(delImg);

	
	for(var i =0, len = this.inventoryImages.length; i < len; i+= 1){
		this.inventoryImages[i].setCoords();
		this.inventoryImages[i].selectable = true;
	}
	
	canvas.remove(this.group);
	this.stoppedBlocks = new Array();
	var heart = null;
	selectedBlock = null;
	editBlocks = new Array();
	//transfer my blocks from part of me to individual entities on the game grid (allows clicking and deleting them)
	for(var x = 0; x < this.gridSize; x+= 1){
		for(var y = 0; y < this.gridSize; y+= 1){
			if(this.grid[x][y] != null){
				addGridSquare(x + this.myX, y + this.myY, this.grid[x][y].type, gameGrid, canvas, null,0,0,this.grid[x][y].pointX,this.grid[x][y].pointY);
				if(this.grid[x][y].quantity != undefined && this.grid[x][y].quantity > 1){
					gameGrid[x + this.myX][y + this.myY].quantity = this.grid[x][y].quantity;
					this.redoSpringBlock(gameGrid[x + this.myX][y + this.myY].image,gameGrid[x + this.myX][y + this.myY]);
				}
				//setting to same angle etc as existing block.
				if(gameGrid[x + this.myX][y + this.myY].usePoints){
					gameGrid[x + this.myX][y + this.myY].pointX = this.grid[x][y].pointX;
					gameGrid[x + this.myX][y + this.myY].pointY = this.grid[x][y].pointY;
					gameGrid[x + this.myX][y + this.myY].getPoints();
					gameGrid[x + this.myX][y + this.myY].redraw(true);
				}
				
				if(this.grid[x][y].resistance < this.grid[x][y].startingStrength){ //if block is damaged
					gameGrid[x + this.myX][y + this.myY].damageAngle = this.grid[x][y].damageAngle;
					gameGrid[x + this.myX][y + this.myY].damageLeft = this.grid[x][y].damageLeft;
					gameGrid[x + this.myX][y + this.myY].damageUp = this.grid[x][y].damageUp;
					gameGrid[x + this.myX][y + this.myY].showDamage();
					
					//put grey square over to indicate can't modify
					var rect = new fabric.Rect({
					  left: (this.myX + x) * gridWidth,
					  top: (this.myY + y) * gridHeight,
					  fill: 'black',
					  width: gridWidth,
					  height: gridHeight,
					  opacity: 0.2,
					  gridX: x,
					  gridY: y,
					  isAddPlace: true
					});	
					rect.lockScalingX = true;
					rect.lockScalingY = true;
					rect.lockMovementX = true;
					rect.lockMovementY = true;
					rect.hasControls = false;
					rect.isDamagedBlock = true;
					this.damagedBlocks.push(rect);
					gameGrid[x + this.myX][y + this.myY].selectable = false;
					canvas.add(rect);
				}
				//end of resettings
				gameGrid[x + this.myX][y + this.myY].isDeletePlace = true;
				
				if(gameGrid[x + this.myX][y + this.myY].type == "heart")
					heart = gameGrid[x + this.myX][y + this.myY];
				
				var block = gameGrid[x + this.myX][y + this.myY].image;
				this.stoppedBlocks.push(block);
				block.lockMovementX = true;
				block.lockMovementY = true;
				block.lockScalingX = true;
				block.lockScalingY = true;
				editBlocks.push(block);
				if(this.grid[x][y].usePoints){
					 	//only rotation allowed
					    block.setControlsVisibility({
					          mt: false, 
					          mb: false, 
					          ml: false, 
					          mr: false, 
					          bl: false,
					          br: false, 
					          tl: false, 
					          tr: false,
					          mtr: true, 
					     });
				}
				else{
					block.lockRotation = false;
					block.hasControls = false;
				}
				block.isDeletePlace = true;
				block.myX = x + this.myX;
				block.myY = y + this.myY;

			}
			
			
			
			
			
		}
	}
	heart.image.bringToFront();
	this.addAllMarkers();
	
};

Player.prototype.addAllMarkers = function(){
	this.rects = new Array();

	//add places I can add blocks in every space adjacent to existing block
	for(var x = 0; x < this.gridSize; x += 1){
		for(var y =0; y < this.gridSize; y += 1){
			if(this.grid[x][y] != null && this.grid[x][y] != undefined){
				if(x == 0 || this.grid[x - 1][y] == undefined || this.grid[x - 1][y] == null)
					this.addMarker(x - 1,y);
				if(y == 0 || this.grid[x][y - 1] == undefined || this.grid[x][y - 1] == null)
					this.addMarker(x,y - 1);
				if(x == this.gridSize - 1 || this.grid[x + 1][y] == undefined || this.grid[x + 1][y] == null)
					this.addMarker(x + 1,y);
				if(y == this.gridSize - 1 || this.grid[x][y + 1] == undefined || this.grid[x][y + 1] == null)
					this.addMarker(x,y + 1);
			}
				
		}
	}
};

function clearMarkers(markers){
	for(var i =0; i < markers.length; i+=1){
		canvas.remove(markers[i]);
		gameGrid[markers[i].left / gridWidth][markers[i].top / gridHeight] = 1;
	}
}

Player.prototype.scrollInventory = function(absolute){
	//reposition inventory so always at top
	if(absolute){
		var scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
		var scrollTop = window.pageYOffset || document.documentElement.scrollTop;
		
		for(var i = 0; i < this.inventoryText.length; i+= 1){
			this.inventoryText[i].left = ((i + 1) * gridWidth) - 10 + scrollLeft;
			this.inventoryText[i].top = gridHeight - 10 + scrollTop;
			this.inventoryImages[i].left = scrollLeft + ((i + 0.5) * gridWidth);
			this.inventoryImages[i].top = (gridHeight * 0.5) + scrollTop;
			this.inventoryImages[i].setCoords();
		}
		invBackground.left = scrollLeft;
		invBackground.top = scrollTop;
		
		message.left = scrollLeft + (displayWidth/2);
		message.top = scrollTop + 30;
		if(curRival != undefined && curRival != null){
			curRival.left = scrollLeft + (document.documentElement.clientWidth - curRival.width - rivalIconMargin);
			curRival.top = scrollTop + rivalIconMargin;
			curRival.setCoords();
		}
		
	}
	else{
		for(var i = 0; i < this.inventoryText.length; i+= 1){
			this.inventoryText[i].left += scrollingX;
			this.inventoryText[i].top += scrollingY;
			this.inventoryImages[i].left += scrollingX;
			this.inventoryImages[i].top += scrollingY;
		}
		invBackground.left += scrollingX;
		invBackground.top += scrollingY;
		
		message.left += scrollingX;
		message.top += scrollingY;
		
		if(curRival != undefined && curRival != null){
			curRival.left += scrollingX;
			curRival.top += scrollingY;
			curRival.setCoords();
		}
	}
};

Player.prototype.addMarker = function(x, y) {
	if(gameGrid[this.myX + x][this.myY + y] != 1)
		return;
	
	// create a rectangle object
	var rect = new fabric.Rect({
	  left: (this.myX + x) * gridWidth,
	  top: (this.myY + y) * gridHeight,
	  fill: 'red',
	  width: gridWidth,
	  height: gridHeight,
	  opacity: 0.2,
	  gridX: x,
	  gridY: y,
	  isAddPlace: true
	});	
	gameGrid[this.myX + x][this.myY + y] = rect;
	
	rect.lockScalingX = true;
	rect.lockScalingY = true;
	rect.lockMovementX = true;
	rect.lockMovementY = true;
	rect.hasControls = false;
	this.rects.push(rect);
	canvas.add(rect);

};

Player.prototype.collectAll = function() {
	Person.prototype.collectAll.call(this);
	this.updateRivals();
};

Player.prototype.updateRivals = function(){
	socket.emit('playerShapeChanged', {gr:getStringArray(this.grid),uID:uniqueID});
}

Player.prototype.setMovement = function(x, y) {
	if(this.rects != undefined && this.rects != null){//I'm just resuming movement after being in edit mode
		this.recreateable = true;
		this.shrink();
		clearMarkers(this.rects);
		for(var i =0; i < this.damagedBlocks.length; i+=1)
			canvas.remove(this.damagedBlocks[i]);
		for(var i =0; i < editBlocks.length; i+= 1)
			canvas.remove(editBlocks[i]);
		this.rects = null;
		this.stoppedBlocks = null;
		for(var i =0, len = this.inventoryImages.length; i < len; i+= 1){
			this.inventoryImages[i].selectable = false;
		}
		canvas.setActiveObject(delImg); //deselect currently selected (until I figure out how to do it properly)
		canvas.remove(delImg);
		this.setupWeapons();
		this.updateRivals();
	}
	if(this.willRotate != 0){
		if(this.movepartsSpeed > 1){//don't rotate when moving slider
			this.rotation = 0;
			this.willRotate = 0;
			this.changedDir = false;
			return;
		}
		else{
			this.rotateAndExtract();
		}
	}
	if(this.willMoveX != undefined){
		this.movX = this.willMoveX;
		this.movY = this.willMoveY;
	}
	this.changedDir = true;
};

Player.prototype.saveTextGrid = function() {
	console.log(timeStamp + ":addpiece" + this.textGrid.length + "s" + this.textGrid + "game"); //s is size
};





Player.prototype.rotate = function(){
	var wasEnlarged = this.enlarged;
	if(wasEnlarged)//correct size grid before rotating
			Player.prototype.shrinkGrid();
	Person.prototype.rotate.call(this);
	if(wasEnlarged)//???
		Player.prototype.activateEditMode();
};

Player.prototype.willSetMovement = function(movX, movY,creep){
	if(this.rects != undefined && this.rects != null)//I'm just resuming movement after being in edit mode
		this.justLeftEditMode = true;
	this.willMoveX = movX;
	this.willMoveY = movY;
	this.creep = creep;
};

Player.prototype.update = function(){
	
	this.adjustScroll();
	this.possiblyLeaveGrid();//check entered next landscape or close enough to at least generate next landscape
	this.possiblyUpdateBlind();
	if(willRestart){//possiblyLeaveGrid sets this if have just moved to next landscape
		this.restart();
		willRestart = false;
	}
	Person.prototype.update.call(this);
};

Player.prototype.tryToChangeDir = function(){
	if((this.willMoveX != undefined || this.willRotate != 0)&& !intermediate && !this.partsMoving){
		this.setMovement();
		this.willMoveX = undefined;
	}
};

Player.prototype.possiblyLeaveGrid = function(){
	
	//getting close
	if(this.myX + this.maxX >= numPiecesX - edgeDetectDis){//getting close to right
		rightGrid = generateNextGrid(rightGrid, seedJumpX);
	}
	else if(this.myX + this.minX < edgeDetectDis){//getting close to left
		leftGrid = generateNextGrid(leftGrid, -seedJumpX);

	}
	else if(this.myY + this.maxY >= numPiecesY - edgeDetectDis){//getting close to bottom
		bottomGrid = generateNextGrid(bottomGrid, seedJumpY);
	}
	else if(this.myY + this.minY < edgeDetectDis){//getting close to top
		topGrid = generateNextGrid(topGrid, -seedJumpY);
	}	
	
	//leaving
	if(this.myX + this.minX == numPiecesX && this.movX == 1){ //heading out right
			clearLandscape();
			curSeed += seedJumpX;
			canvas.clear();
			this.myY = newXYForNeighbour(rightGrid,this.myY + this.minY,this.maxY - this.minY + 1,gameGrid[0].length,rightGrid.grid[0].length, rightGrid.grid.length,true,"left") - this.minY ;			
			start();
			this.myX = - this.maxX - 1;
			willRestart = true;
			this.justArrived = true;
			clearOldNeighbours(rightGrid);
	}
	else if(this.myX + this.maxX == -1 && this.movX == -1){ //left 
			//for memory = clear out grids which won't be next to me
			clearLandscape();
			curSeed -= seedJumpX;
			canvas.clear();
			this.myY = newXYForNeighbour(leftGrid,this.myY + this.minY,this.maxY - this.minY + 1,gameGrid[0].length,leftGrid.grid[0].length,leftGrid.grid.length, true, "right")- this.minY;			
			start();
			this.myX = numPiecesX - this.minX;
			willRestart = true;
			this.justArrived = true;
			clearOldNeighbours(leftGrid);
	}
	else if(this.myY + this.minY == numPiecesY && this.movY == 1){ //heading out bottom
			clearLandscape();
			curSeed += seedJumpY;
			canvas.clear();
			this.myX = newXYForNeighbour(bottomGrid,this.myX + this.minX,this.maxX - this.minX + 1,gameGrid.length,bottomGrid.grid.length, bottomGrid.grid[0].length,true,"top") - this.minX ;
			start();
			this.myY = - this.maxY - 1;
			willRestart = true;
			this.justArrived = true;			
			//for memory = clear out grids which won't be next to me			
			clearOldNeighbours(bottomGrid);
	}
	else if(this.myY + this.maxY == -1 && this.movY == -1){ //top 
			clearLandscape();
			curSeed -= seedJumpY;
			canvas.clear();
			this.myX = newXYForNeighbour(topGrid,this.myX + this.minX,this.maxX - this.minX + 1,gameGrid.length,topGrid.grid.length,topGrid.grid[0].length, true, "bottom")- this.minX;
			start();
			this.myY = numPiecesY - this.minY;
			willRestart = true;
			this.justArrived = true;
			//for memory = clear out grids which won't be next to m
			clearOldNeighbours(topGrid);
	}
};

//if just moved from one landscape to another how far down side do I appear?
//HEIGHT = length of side entering so if entering left/right will be height - if entering top/bottom will be WIDTH
//WIDTH = adjacent side to height
function newXYForNeighbour(neighLand,myXY, myHeight, curHeight,neighHeight,neighWidth,seekHoles,side){
	//height of new land/height of old
	var ratio = neighHeight / curHeight;
	//find equivalent place on new land side or near bottom of new land if its too short for that
	var pos = Math.min(neighHeight - myHeight,Math.round(myXY * ratio));

	if(neighHeight < curHeight || !seekHoles)
		return Math.round(pos);
	else{//seekHoles for now always true(?) - it ensures when return to old landscape will always go through hole already created rather than having to break new one
		var grid = neighLand.grid;
		var x;
		var y;
		if(side == "left") //side I'm checking on the neighbour (opposite side to what I'm leaving)
			x = 0;
		else if(side == "right")
			x = neighWidth - 1;
		else if(side == "top")
			y = 0;
		else if(side == "bottom")
			y = neighWidth - 1;
		
		var start = Math.floor(pos);
		var end = Math.ceil(pos);
		
		//find largest gap
		var maxGap = 0;
		var count = 0;
		var startGap;
		var endGap;
		for(var i = start; i < end; i += 1){
			if ( ((side == "left" || side == "right") && grid[x][i] == 1)
					||
				 ((side == "top" || side == "bottom") && grid[i][y] == 1)){
				if(tempStartGap == -1)
					tempStartGap = y;
				count += 1;
			}
			else{
				if(count > maxGap){
					maxGap = count;
					endGap = i - 1;
					startGap = tempStartGap;
				}
				count = 0;
				tempStartGap = -1;
			}
		}
		if(count > 0){//reached bottom but not reached end of gap
			if(count > maxGap){
				endGap = end;
				startGap = tempStartGap;
			}
		}
		
		if(startGap == undefined) //no gaps
			return pos;
		return Math.floor(Math.seededRandomDouble(startGap, endGap - myHeight));
	}
}

Player.prototype.respondToDamage = function(){
	Person.prototype.respondToDamage.call(this);
	this.resetFace("goodfaceHurt");
	this.isHurt = true;
	if(this.rects != undefined && this.rects != null){//if damaged while editing redo markers
		clearMarkers(this.rects);
		this.addAllMarkers();
	}
	this.updateRivals();
};

//spinning motion going down stairs
Player.prototype.animateDownStairs = function() {
	
	animating = true;
		this.group.animate('angle', makeAnimateString(360 * stairRotations), {
	          onComplete: function(){
	          	goDownStairs();
	          },
	       duration: stairDuration
			});
		this.group.animate('scaleX', 0.1, {
				duration: stairDuration
			});
		
		this.group.animate('scaleY', 0.1, {
				duration: stairDuration
			});
		
		this.group.animate('left', ((activatedStairs.x + 1) * gridWidth), {
				duration: stairDuration
			});
		
		this.group.animate('top', ((activatedStairs.y + 1) * gridHeight), {
				duration: stairDuration
			});
};

Player.prototype.getOtherRobot = function() {
	return enemy;
};

Player.prototype.emergeFromStairs = function(stairs){
	this.myX = stairs.x + 1 - Math.round((this.maxX - this.minX)/2) - this.minX;
	this.myY = stairs.y + 1 - Math.round((this.maxY - this.minY)/2) - this.minY;
	this.movX = 0;
	this.movY = 0;
	if(this.extractFromOverlap()){//didn't manage to get out of corner last time (i.e. randomly picking directions to get away didn't work)
		this.emergeFromStairs(stairs);//try again
	}
	else{
		//draw in middle of stairs
		this.group.left = (stairs.x + 1) * gridWidth;
		this.group.top = (stairs.y + 1) * gridHeight;
		
		var newX = (this.myX * gridWidth) + ((this.gridSize * gridWidth) / 2);
		var newY = (this.myY * gridHeight) + ((this.gridSize * gridHeight) / 2);
	
		canvas.add(this.group);
		
		//spinning motion going up stairs
		this.group.animate('angle', makeAnimateString(360 * stairRotations), {
	        onComplete: function(){
	        	willGoDownStairs = false;
	        	updateGame();
	        },
	     duration: stairDuration
			});
		this.group.animate('scaleX', 1, {
				duration: stairDuration
			});
		
		this.group.animate('scaleY', 1, {
				duration: stairDuration
			});
		
		this.group.animate('left', newX, {
				onChange: scrollToPlayer(),
				duration: stairDuration
			});
		
		this.group.animate('top', newY, {
				duration: stairDuration
			});
	}
};

Player.prototype.adjustScroll = function() {
	var windowLeft = window.pageXOffset || document.documentElement.scrollLeft;
	var windowTop = window.pageYOffset || document.documentElement.scrollTop;
	var offTop = this.group.top - windowTop < (4 * gridHeight);
	var offBottom = this.group.top + this.group.height - windowTop > (clientHeight - (4 * gridHeight));
	
	var offLeft = this.group.left - windowLeft < (4 * gridWidth);
	var offRight = this.group.left + this.group.width - windowLeft > (clientWidth - (4 * gridWidth));
	var speedUp = (scrollDelay / initialInterval) * gridWidth * this.fastSpeed_fixed * scrollSpeedup;
	
	
	if(this.collided || this.partsMoving){
		scrollingX = 0;
		scrollingY = 0;
	}
	if(this.movX == 1 && windowLeft < maxScrollX && offRight){
		if(scrollingX == 0){
			scrollingX = speedUp;
			scrollLoop();
		}
	}
	else if(this.movX == -1 && windowLeft > canvas._offset.left && offLeft){
		if(scrollingX == 0){
			scrollingX = -speedUp;
			scrollLoop();
		}
	}
	else if(this.movY == 1 && windowTop < maxScrollY && offBottom){
		if(scrollingY == 0){
			scrollingY = speedUp;
			scrollLoop();
		}
	}
	else if(this.movY == -1 && windowTop > canvas._offset.top && offTop){
		if(scrollingY == 0){
			scrollingY = -speedUp;
			scrollLoop();
		}
	}
	
	if(!((scrollingX > 0 && this.movX == 1) || (scrollingX < 0 && this.movX == -1)) || (scrollingX > 0 && offLeft) || (scrollingX < 0 && offRight))
		scrollingX = 0;
	if(!((scrollingY > 0 && this.movY == 1) || (scrollingY < 0 && this.movY == -1))  || (scrollingY > 0 && offTop) || (scrollingY < 0 && offBottom))
		scrollingY = 0;


};

///////////////////////////SPECIALS/////////////////////////////////////

Player.prototype.scramble = function(scrambler){
	this.resetFace("goodfaceConfused");
	Person.prototype.scramble.call(this, scrambler);

}

Player.prototype.unscramble = function(scrambler){
	Person.prototype.unscramble.call(this, scrambler);
	this.resetFace("goodface");
}

Player.prototype.convertCode = function(code){
	if(this.keyCodes[code] == undefined)
		return code;
	return this.keyCodes[code];
}

Player.prototype.possiblyUpdateBlind = function(code){
	if(this.blinder == undefined || this.blinder == null)
		return;
	if(Math.maybeSeededRandom(0,1) < (this.blindedCounter / (blindedCounterMax))){
		this.blinder.addCircle(Math.maybeSeededRandom(0, displayWidth), Math.maybeSeededRandom(0, displayHeight), Math.maybeSeededRandom(10,200), true)
	}
	if(this.blinder.numBubbles == 0){
		this.blinder.loseEffect();
		this.blinder = null;
		this.resetFace("goodface");
	}

	
	this.blindedCounter --;
}

Player.prototype.blind = function(blinder){
	this.blinder = blinder;
	blinder.fillWithBubbles();
	this.blindedCounter = Math.maybeSeededRandom(blindedCounterMin, blindedCounterMax);
	this.resetFace("goodfaceBlind");
}


