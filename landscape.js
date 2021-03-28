//compact - whole landscape is one big area
var minCompactSize = 13;
var maxCompactSize = 50;

//tubular - lots of different areas joined together. long areas (tubes) or square areas (squat)
var maxTotalSize = 70 * 70;
var maxNumTubes = 5;
var minNumTubes = 2;
//size of individual areas
var minTubeLength = 10;
var maxTubeLength = 30;
var minTubeWidth = 5;
var maxTubeWidth = 10;
var minSquat = 10;
var maxSquat = 20;

//number and size of smaller clumps (noise)
var maxSizeCluster = 5;
var minSizeCluster = 1;
var maxNoise = 30;
var minNoise = 10;

//randomly positioning areas to the side of me
var minNeighbourOffset = -5;

var enemySize = 0;

//enemy special block probabilities
var plainProb = 0.5;
var motorProb = 0.7; //0.2;
var springProb = 0.8; //0.1;
var blinderProb = 0.85; //0.05;
var scramblerProb = 0.9; //0.05;
var crystalProb = 1; //0.1;



var Landscape = function(seed, globalSeed){
	this.seed = seed;
	this.globalSeed = globalSeed;
	this.changedBlocks = new Array();
	this.stairDests = new Array();
	this.totalNumEnemies = Math.seededRandom(3,10);//number of enemies before enemies stop respawning TODO change to unlimited but pauses between
	this.enemiesLeft = this.totalNumEnemies;
};

Landscape.prototype.makeGrid = function(){
	
	this.enemyXs = [];
	this.enemyYs = [];
	this.stairs = [];
	this.enemyAreas = [];
	this.areas = [];

	this.stairs = new Array();
	
	this.returnStairDone = false;
	
	Math.seed = this.seed + this.globalSeed;
	var grid;
	var height, width;
	var numEnemies = Math.seededRandom(1,3);//number of spawn sites	
	var rndVal = Math.seededRandom(0,20);
	//ensure at least one set of stairs available if I'm the destination of another landscape's stairs
	if(this.returnStair != undefined)
		rndVal = Math.seededRandom(0,5);
	this.numStairs = 0;
	if(rndVal <= 3 || this.initialLandscape())
		this.numStairs = 1;
	else if(rndVal == 4)
		this.numStairs = 2;
	else if(rndVal == 5)
		this.numStairs = 3;

	
	this.wallLefts = new Array();
	this.wallTops = new Array();
	this.wallWidths = new Array();
	this.wallHeights = new Array();

	var init = this.initialLandscape()
	//this.enemyGrid = designEnemy(false,false,"blinder");
	
	//this.enemyGrid = designEnemy(false,false);

	if(init)
		this.enemyGrid = designEnemy(false,false);
	else{
		var prob = Math.seededRandomDouble();
		if(prob < plainProb){
			this.enemyGrid = designEnemy(false,false);
		}
		else if(prob < motorProb)
			this.enemyGrid = designEnemyMotor();
		else if(prob < springProb)
			this.enemyGrid = designEnemy(false,true);
		else if(prob < blinderProb)
			this.enemyGrid = designEnemy(false,false,"blinder");
		else if(prob < scramblerProb)
			this.enemyGrid = designEnemy(false,false,"scrambler");
		else
			this.enemyGrid = designEnemy(false,false,"crystal");

	}

	
	//adjust grid sizes for enemy size TODO make adjustments global
	enemySize = this.enemyGrid[0].length;
	minCompactSize = enemySize + playerStartSize + 4;
	maxCompactSize = minCompactSize * 2.5;
	minTubeWidth = enemySize * 0.75;
	maxTubeWidth = enemySize * 1.5;
	minTubeLength = minTubeWidth * 2;
	maxTubeLength = maxTubeWidth * 3;
	minSquat = enemySize + 2;
	maxSquat = enemySize * 2.5;
	//maxTotalSize = Math.pow(Math.max(maxSquat * 3.5, 100),2);
		
	//totalAreas
	if(Math.seededRandom() == 0){ //compact
		numAreas = 1;
		height = Math.seededRandom(minCompactSize, maxCompactSize);
		width = Math.seededRandom(minCompactSize, maxCompactSize);
		
		var left = 1;
		var top = 1;
		
		//randomly position (if false fills whole screen so no need to position)
		if(width < numPiecesScreenX - 2)
			left = Math.seededRandom(1, numPiecesScreenX - width - 1)
		if(height < numPiecesScreenY - 2)
			top = Math.seededRandom(1, numPiecesScreenY - height - 1)

		//if smaller than screen size will pad to screen size as can't have places shown on screen which are off edge of grid
		var gridWidth = Math.max(numPiecesScreenX, width + 2);
		var gridHeight = Math.max(numPiecesScreenY, height + 2);

			
		grid = new Array(gridWidth);
		for(var x = 0; x < gridWidth; x += 1)
			grid[x] = new Array(gridHeight);
		
		var area = new Area(left, top, width, height);
		this.areas.push(area);
		this.enemyAreas.push(area);
		
		drawInGrid(left,top,width,height, grid);
		//keep near edge to minimise clashes with enemy
		if(this.initialLandscape()){
			//generate player at edge of landscape and then move a few pieces in
			this.playerX = Math.seededRandom(0,1) * width;
			this.playerY = Math.seededRandom(0,1) * height;
			if(this.playerX > 0)
				this.playerX -= (playerStartSize + Math.seededRandom(0,3));
			else
				this.playerX += Math.seededRandom(0,3);
			if(this.playerY > 0)
				this.playerY -= (playerStartSize + Math.seededRandom(0,3));
			else
				this.playerY += Math.seededRandom(0,3);
			this.playerX += left;
			this.playerY += top;
		}
		
		//add enemies
		for(var i =0; i < numEnemies; i += 1){
			var enemyX = Math.seededRandom(left, left + width - enemySize);
			var enemyY = Math.seededRandom(top, top + height - enemySize);
			

			while(
					(this.initialLandscape() && 
					(Math.abs(enemyX - this.playerX) < playerStartSize && 
					Math.abs(enemyY - this.playerY) < playerStartSize)
					
					)
				|| this.overlapEnemies(enemyX, enemyY)){
				enemyX = Math.seededRandom(left, left + width - enemySize);
				enemyY = Math.seededRandom(top, top + height - enemySize);
			}

			this.enemyXs.push(enemyX);
			this.enemyYs.push(enemyY);

			
		}
			
		this.setupStairs(this.numStairs);
	}
	else{
		//the maximum size that tubular world conceivably could be
		//will shrink down to size later
		//TODO hard coded for max 5 squares
		height = width = ((maxTubeLength + maxSquat + maxTubeLength + maxSquat + maxTubeLength) * 2);
		grid = this.makeTubular(width,height, numEnemies);
		
		height = grid[0].length;
		width = grid.length;
	}
	

	this.grid = grid;
	
	this.addNoise(width, height);
		
	return grid;
};


Landscape.prototype.initialLandscape = function(){
	if(this.globalSeed == startGlobalSeed && this.seed == startSeed)
		return true;
	else
		return false;
}

Landscape.prototype.overlapEnemies = function(x, y){
	for(var i =0; i < this.enemyXs.length; i += 1){
		if((Math.abs(x - this.enemyXs[i]) < playerStartSize) && (Math.abs(y - this.enemyYs[i]) < playerStartSize))
			return true;
	}
	return false;
}

//add noise
Landscape.prototype.addNoise = function(width, height){
	this.noiseLefts = [];
	this.noiseTops = [];
	this.noiseWidths = [];
	this.noiseHeights = [];
	
	var numNoise = Math.seededRandom(minNoise,maxNoise);
	for(var i =0; i < numNoise; i += 1){
		
		var num1s = 0;
		var count = 0;
		
		while(num1s == 0 && count < 5){
			var squareWidth = Math.seededRandom(minSizeCluster,maxSizeCluster);
			var squareHeight = Math.seededRandom(minSizeCluster,maxSizeCluster);
			var left = Math.seededRandom(1,width - squareWidth - 2);
			var top = Math.seededRandom(1,height - squareHeight - 2);
			var right = left + squareWidth;
			var bottom = top + squareHeight;
	
			var num0s = 0;
				
				for(var x =left; x <= right; x+= 1){
					for(var y = top ; y <= bottom; y+= 1){
						if(this.grid[x][y] == undefined)
							num0s++;
						else if(this.grid[x][y] == 1)
							num1s++;
					}
				}
			count += 1;
		}
		
		//check not overalapping with anything
		if(this.checkNoiseSquare(left,top,squareWidth,squareHeight)){
			//if the place where I'm about to put noise square is mainly wall then the noise square will *probably* be negative (i.e. removing wall), otherwise it will be a plain square of wall
			
			//find out whether area of mainly 1s (open spaces) or undefined (walls)
			var ratio = num1s / (num1s + num0s);
			
			var newVal;
			
			//if mainly 0s then higher probability will add 1s and vice versa
			if(Math.seededRandomDouble() > ratio){
				newVal = 1;
				this.noiseLefts.push(left);
				this.noiseTops.push(top);
				this.noiseWidths.push(squareWidth);
				this.noiseHeights.push(squareHeight);

			}
			else{
				this.wallLefts.push(left);
				this.wallTops.push(top);
				this.wallWidths.push(squareWidth);
				this.wallHeights.push(squareHeight);

				
			}
			for(var x =left; x <= right; x+= 1){
				for(var y = top ; y <= bottom; y+= 1){
					this.grid[x][y] = newVal;
				}
			}
		}
			
	}
}

//don't put extra blocks where they can block player or enemy spawn site
Landscape.prototype.checkNoiseSquare = function(x,y,squareWidth,squareHeight){
	//player
	if(  Math.abs((this.playerX + Math.round(playerStartSize / 2)) - (x + Math.round(squareWidth / 2)))
			< (Math.round(playerStartSize / 2) + Math.round(squareWidth / 2))
			&&
			Math.abs((this.playerY + Math.round(playerStartSize / 2)) - (y + Math.round(squareHeight / 2)))
			< (Math.round(playerStartSize / 2) + Math.round(squareHeight / 2)))
					return false; //failed = too close to player
	
	//enemy
	for(var i =0; i < this.enemyXs.length; i += 1){
		if(  Math.abs((this.enemyXs[i] + Math.round(enemySize / 2)) - (x + Math.round(squareWidth / 2)))
				< (Math.round(enemySize / 2) + Math.round(squareWidth / 2))
				&&
				Math.abs((this.enemyYs[i] + Math.round(enemySize / 2)) - (y + Math.round(squareHeight / 2)))
				< (Math.round(enemySize / 2) + Math.round(squareHeight / 2)))
						return false; //failed = too close to enemy
	}
	//stairs
	
	for(var i =0; i < this.stairs.length; i += 1){
		if(  Math.abs((this.stairs[i].x + 1) - (x + Math.round(squareWidth / 2)))
				< (Math.round(playerStartSize / 2) + Math.round(squareWidth / 2))
				&&
				Math.abs((this.stairs[i].y + 1) - (y + Math.round(squareHeight / 2)))
				< (Math.round(playerStartSize / 2) + Math.round(squareHeight / 2)))
						return false; //failed = too close to stairs
	}
	
	//spanning whole width or height of areas
	
	for(var i =0; i < this.areas.length; i += 1){
		var left = this.areas[i].left;
		var right = this.areas[i].left + this.areas[i].width;
		var top = this.areas[i].top;
		var bottom = this.areas[i].top + this.areas[i].height;

		
		if(x < right && x + squareWidth > left && y < bottom && y + squareHeight > top){ //in this square
			var overlapX, overlapY;
			if(x < left)
				overlapX = left - x;
			else if(x + squareWidth > right)
				overlapX = x + squareWidth - right;
			if(y < top)
				overlapY = top - y;
			else if(y + squareHeight > bottom)
				overlapY = y + squareHeight - bottom;				
			
			if((squareWidth - overlapX) > this.areas[i].width - playerStartSize)
				return false;
			
			if((squareHeight - overlapY) > this.areas[i].height - playerStartSize)
				return false;
		}
	}
	
	return true;

}

Landscape.prototype.setupStairs = function(num){	
	
	for(var i =0; i < num; i += 1){
		var stairX, stairY;
		
		//positioning
		while( stairX == undefined ||
				this.overlapEnemies(stairX, stairY)//replace while too close to player or other door
			
			|| this.overlapOtherStairs(stairX, stairY)){
			
			var which = Math.floor(Math.seededRandomDouble(0, this.areas.length));//which tube to place it in
			var left = this.areas[which].left;
			var top = this.areas[which].top;
			var width = this.areas[which].width;
			var height = this.areas[which].height;
			
			stairX = Math.seededRandom(left,left + width - 2);
			stairY = Math.seededRandom(top,top + height - 2);

		}
		
			var dest;
			var destStairIndex; 
			//if I'm a destination of a previous landscape's stairs 
			if(!this.returnStairDone && this.returnStair != undefined){
				dest = this.returnStair;
				this.returnStairDone = true;
				for(var st = 0; st < this.returnStair.stairs.length; st += 1){
					if(this.returnStair.stairs[st].dest == this)
						destStairIndex = st;
				}
					
			}
			else{
				//where destination stair is in its universe
				var destSeed = Math.seededRandom(1000000,2000000);
				//defines destination stairs universe
				var destGlobalSeed = Math.seededRandomDouble();
				if(this.stairDests[this.stairs.length] != undefined){
					dest = this.stairDests[this.stairs.length];
					//TODO 22/10- temporary solution to keep seeds level until introduce infinite enemies
					Math.seededRandom(1,3);
				}
				else{
					dest = new Landscape(destSeed, destGlobalSeed);
					this.stairDests[this.stairs.length] = dest;
					dest.returnStair = this;//one of its stairs should lead back to this
				}
				destStairIndex = 0;
			}
		this.stairs.push(new Stair(stairX, stairY, dest, destStairIndex));
	}
}

Landscape.prototype.overlapRobot = function(centerX, centerY, hisLeft, hisRight,
											hisTop, hisBottom){
	
	if((Math.abs(centerX - hisLeft) < 4 || Math.abs(centerX - hisRight) < 4 ||
			(hisLeft < centerX && hisRight > centerX))
			 && 
	  (Math.abs(centerY - hisTop) < 3 || Math.abs(centerY - hisBottom) < 3 ||
				(hisTop < centerY && hisBottom > centerY))
			  )
			return true;
	return false;
}

Landscape.prototype.overlapOtherStairs = function(stairX, stairY){
	for(var i = 0; i < this.stairs.length; i += 1){
			if(((Math.abs(stairX - (this.stairs[i].x + 2)) < 3) ||
					(Math.abs(this.stairs[i].x - (stairX + 2))< 3))	
						&& 
					((Math.abs(stairY - (this.stairs[i].y + 2)) < 3) ||
					(Math.abs(this.stairs[i].y - (stairY + 2)) < 3)))
				return true;
	}
}

var Stair = function (x, y, dest, destStairIndex) { 
	this.x = x;
	this.y = y;
	this.dest = dest;
	this.destStairIndex = destStairIndex
};

Landscape.prototype.makeTubular = function(totalWidth, totalHeight, numEnemies){
	this.enemyXs = [];
	this.enemyYs = [];
	this.enemyAreas = [];
	this.areas = [];
	
	var grid = new Array(totalWidth);
	for(var x = 0; x < totalWidth; x += 1)
		grid[x] = new Array(totalHeight);

	
	numAreas = Math.seededRandom(minNumTubes, maxNumTubes);

	var vertical = false;
	var horizontal = false;
	var squat = false;
	var firstArea = true;
	
	var left, right, top, bottom;

	var oldLeft, oldRight, oldTop, oldBottom;
	var olderLeft = -1, olderRight, olderTop, olderBottom;
	var oldHorizontal, oldVertical, oldSquat;
	
	var minX, maxX, minY, maxY;
	
	for(var i =0; i < numAreas; i += 1){
		//if the previous area was "squat" the next area should be a tube to connect to it - make a choice between squat, vertical and horizonal accordingly
		if(vertical){
			vertical = false;
			if(Math.seededRandom() == 0)
				horizontal = true;
			else
				squat = true;
		}
		else if(horizontal){
			horizontal = false;
			if(Math.seededRandom() == 0)
				vertical = true;
			else
				squat = true;
		}
		else if(squat){
			squat = false;
			if(Math.seededRandom() == 0)
				vertical = true;
			else
				horizontal = true;
		}
		else{ //first area
			var val = Math.seededRandom(0,2);
			if(val == 0)
				vertical = true;
			else if(val == 1)
				horizontal = true;
			else
				squat = true;
		}
		
		//creating
		var width;
		var height;
		if(vertical){
			width = Math.seededRandom(minTubeWidth,maxTubeWidth);
			height = Math.seededRandom(width * 2,maxTubeLength); 
		}
		else if(horizontal){
			height = Math.seededRandom(minTubeWidth,maxTubeWidth);
			width = Math.seededRandom(height * 2,maxTubeLength); 
		}
		else{
			height = width = Math.seededRandom(minSquat,maxSquat);
		}
		
		//positioning
		if(firstArea){
			//starts in a center so further areas can go anyway
			left = Math.round(totalWidth/2 - width/2);
			top = Math.round(totalHeight/2 - height/2);
			
			minX = left;
			minY = top;
			maxX = left + width;
			maxY = top + height;
			
			this.playerX = Math.seededRandom(minX, maxX - playerStartSize);
			this.playerY = Math.seededRandom(minY, maxY - playerStartSize);
						
		}
		else{
			
			
			
			if(horizontal){
				
				if(oldSquat){ //if last one squat has to be other side from last last one
					if(olderLeft == oldRight)
						left = oldLeft - width;
					else
						left = oldRight;
				}
				else{
					if(Math.seededRandom() == 0)
						left = oldLeft - width;
					else
						left = oldRight;
				}
				
				if(olderLeft != -1 && (olderLeft < oldLeft) == (left < oldLeft)){ //if I'm on the same side as the last one with my orientation
					if((oldBottom - olderBottom <= height) || (Math.seededRandom() == 0 && (olderTop - oldTop > height)))
						top = Math.seededRandom(oldTop, olderTop - height - 1); //place higher than previous
					else
						top = Math.seededRandom(olderBottom + 1, oldBottom - height); //lower than previous
				}
				else{
					top = Math.seededRandom(oldTop, oldBottom - height);
				}
			}
			else if(vertical){
				if(oldSquat){ //if last one squat has to be other side from last last one
					if(olderTop == oldBottom)
						top = oldTop - height;
					else
						top = oldBottom;
				}
				else{
					if(Math.seededRandom() == 0)
						top = oldTop - height;
					else
						top = oldBottom;
				}
				
				if(olderLeft != -1 && (olderTop < oldTop) == (top < oldTop)){
					if((oldRight - olderRight <= width) || (Math.seededRandom() == 0 && (olderLeft - oldLeft > width)))
						left = Math.seededRandom(oldLeft, olderLeft - width - 1); //place higher than previous
					else
						left = Math.seededRandom(olderRight + 1, oldRight - width); //lower than previous
				}
				else{
					left = Math.seededRandom(oldLeft, oldRight - width);
				}
			}
			else{ //squat
				var dir = Math.seededRandom();
				if(dir == 0){//it's "horizontal"
					if(olderLeft < oldLeft)
						left = oldRight;
					else if(olderLeft = oldRight)
						left = oldLeft - width;
					else{
						if(Math.seededRandom() == 0) //don't allow on same side
							left = oldLeft - width;
						else
							left = oldRight;
					}
					top = Math.seededRandom(oldTop, oldBottom - height);
				}
				else {//it's "vertical"
					
					if(olderTop < oldTop)
						top = oldBottom;
					else if(olderTop = oldBottom)
						top = oldTop - height;
					else{
						if(Math.seededRandom() == 0)
							top = oldTop - height;
						else
							top = oldBottom;
					}
					left = Math.seededRandom(oldLeft, oldRight - width);

				}
			}
			
			if(left < minX)
				minX = left;
			if(left + width > maxX)
				maxX = left + width;
			if(top < minY)
				minY = top;
			if(top + height > maxY)
				maxY = top + height;
				
		}
		if(!firstArea){
			olderLeft = oldLeft;
			olderRight =  oldRight;
			olderTop = oldTop;
			olderBottom = oldBottom;
		}
		
		oldLeft = left;
		oldRight =  left + width;
		oldTop = top;
		oldBottom = top + height;
		
		oldVertical = vertical;
		oldHorizontal = horizontal;
		oldSquat = squat;
		
		var area = new Area(left, top, width, height);
		if(this.areas.length > 0)
			area.addNeighbour(this.areas[this.areas.length - 1]);
		this.areas.push(area);

		drawInGrid(left,top,width,height, grid);
		
		firstArea = false;
	}
	
	for(var i =0; i < numEnemies; i += 1){
		var enemyX, enemyY, area;
		while(
				enemyX == undefined ||
				
				(this.initialLandscape() &&
				(Math.abs(enemyX - this.playerX) < enemySize && Math.abs(enemyY - this.playerY) < enemySize)
				)
				
				|| this.overlapEnemies(enemyX, enemyY)){
					area = this.areas[Math.seededRandom(0, numAreas - 1)];
					var left = area.left;
					var top = area.top;
					var width = area.width;
					var height = area.height;
					
					enemyX = Math.seededRandom(left, left + width - enemySize);
					enemyY = Math.seededRandom(top, top + height - enemySize);
		
		}
		this.enemyXs.push(enemyX);
		this.enemyYs.push(enemyY);
		this.enemyAreas.push(area);
		
	}

	
	this.setupStairs(this.numStairs);	

	
	if(((maxX - minX) * (maxY - minY)) > maxTotalSize)
		grid = this.makeTubular(totalWidth, totalHeight, numEnemies); //too big try again
	else 
		grid = this.shrink(grid, minX, maxX, minY, maxY);
	return grid;
}

//might actually be grow if a wide margin is selected
Landscape.prototype.shrink = function(grid, minX, maxX, minY, maxY){

	var width = maxX - minX;
	var height = maxY - minY;
	
	//recreate grid smaller
	var newWidth = Math.max(width + 2, numPiecesScreenX);
	var newHeight = Math.max(height + 2, numPiecesScreenY);
	var newGrid = new Array(newWidth);
	
	var left = 1;
	var top = 1;
	
	if(width < numPiecesScreenX - 2)
		left = Math.seededRandom(1, numPiecesScreenX - width - 1);
	if(height < numPiecesScreenY - 2)
		top = Math.seededRandom(1, numPiecesScreenY - height - 1);
	
	
	for(var x = 0; x < left; x += 1){
		newGrid[x] = new Array(newHeight);
	}	
		
	for(var x = minX; x < minX + newWidth; x += 1){
		newGrid[x - minX + left] = new Array(newHeight);
		for(var y = minY; y < minY + newHeight; y += 1){
			newGrid[x - minX + left][y - minY + top] = grid[x][y];
		}
	}

	this.playerX -= (minX - left);
	this.playerY -= (minY - top);
		
	for(var i =0; i < this.areas.length; i+= 1){
		this.areas[i].left -= (minX - left);
		this.areas[i].top -= (minY - top);
	}

	
	for(var i = 0; i < this.stairs.length; i+= 1){
		this.stairs[i].x -= (minX - left);
		this.stairs[i].y -= (minY - top);
	}
	
	for(var i = 0; i < this.enemyXs.length; i+= 1){
		this.enemyXs[i] -= (minX - left);
		this.enemyYs[i] -= (minY - top);
	}

	return newGrid;
}

drawInGrid = function(left,top,width,height, grid){
	for(var x = left; x < left + width; x += 1){
		for(var y = top; y < top + height; y += 1){
			grid[x][y] = 1;
		}
	}
}

var Area = function (left, top, width, height){
	this.left = left;
	this.top = top;
	this.width = width;
	this.height = height;
	this.neighbours = [];
};

Area.prototype.addNeighbour = function(area){
	this.neighbours.push(area);
	area.neighbours.push(this);
}
