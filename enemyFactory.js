"use strict";
//plain - just knives
var minEnemyBlocks = 5;
var maxEnemyBlocks = 15;
var minEnemyGrid = 6;
var maxEnemyGrid = 9;

var minEnemyBlocksCrystal = 5;
var maxEnemyBlocksCrystal = 10;
var minEnemyGridCrystal = 4;
var maxEnemyGridCrystal = 7;


//motor
var minEnemyMotorGrid = 10;
var maxEnemyMotorGrid = 15;
//a motor's width is how far it sticks out in the direction adjacent to it's direction of motion (including the motor itself)
//minimum will always be 2 (one block above the motor)
//minMotWidth = 2
var maxMotWidth = 5; 

var probMotorFullLength = 0.5;
var enemyKnifeProb = 0.2;

var heartInBiggestProb = 0.95;

var springProb = 0.6;


function designEnemy(initialLandscape, addSprings, special){
	var size = Math.seededRandom(minEnemyGrid, maxEnemyGrid);
	var numBlocks = Math.seededRandom(minEnemyBlocks, (size - 2)  * (size - 2) );
	var wallType = "wall";

	if(special == "crystal"){
		size = Math.seededRandom(minEnemyGridCrystal, maxEnemyGridCrystal);
		numBlocks = Math.seededRandom(minEnemyBlocksCrystal, (size - 2)  * (size - 2) );
		wallType = "crystal";
	}
	
	
	var enemyGrid =[];
	for(var i =0; i < size; i+= 1){
		enemyGrid.push(new Array(size));
	};
	
	var blockArray = [];
	var options = [];
	var dontAdd = false;
	//add blocks to the grid at random
	for(var i =0; i < numBlocks; i += 1){
		var newX = -1;
		var newY = -1;
		if(i == 0){//add the first block anywhere
			newX = Math.seededRandom(1,size - 2);
			newY = Math.seededRandom(1,size - 2);
			
		}//subsequent blocks are added so that they are next to existing block
		else{
			dontAdd = false;
			var wrongPlace = true;
			while(wrongPlace){
				var index = 0;
				
				//there is one "option" for every block already added. 
				//option is a 4 item array where [0] means new piece can be added to the left, 
				//[1] means can be added right, [2] means can be added top and [3] means can be added bottom
				if(options.length > 1) //if more than one block has been added choose to add adjacent to one of them at random, get the appropriate option[]
					index = Math.seededRandom(0, options.length - 1);
				else if(options.length == 0){
					dontAdd = true; //choose another block to add adjacent to
					newX = Math.seededRandom(1, size - 1);
					newY = Math.seededRandom(1, size - 1);
					while(enemyGrid[newX][newY] == undefined){
						newX = Math.seededRandom(1, size - 1);
						newY = Math.seededRandom(1, size - 1);
					}
					wrongPlace = false;
				}
				if(!dontAdd){
					var option = options[index];
					if(option == undefined)
						alert("something went wrong in landscape.designEnemy(line 175)");
					var oldBlock = blockArray[option[1]];
					
					newX = oldBlock.myX;
					newY = oldBlock.myY;
					if(option[0] == 0)
						newX -= 1;
					else if(option[0] == 1)
						newX += 1;
					else if(option[0] == 2)
						newY -= 1;
					else if(option[0] == 3)
						newY += 1;
					
					if(newX < 1 || newX >= size - 1 || newY < 1 || newY >= size - 1 || enemyGrid[newX][newY] != undefined){
						//I thought I could add to left/right/up/down of this block but turned out I can't or I already filled it
						
						options.splice(index, 1);//remove that option
						wrongPlace = true;
					}
					else{
						wrongPlace = false;
					}
				}
			};
			
		}
		
		if(!dontAdd){
			var block = new TempBlock(wallType,newX,newY);
			enemyGrid[newX][newY] = block;
			blockArray.push(block);
		}
		if(newX > 1)
			options.push([0,i]);
		if(newX < size - 2)
			options.push([1,i]);
		if(newY > 1)
			options.push([2,i]);
		if(newY < size - 2)
			options.push([3,i]);
	};
	
	
	//add either 1 knife or 2 to 4 knives (equal chance of either)
	var numKnives = 1;
	
	if(Math.seededRandom() == 0 && !initialLandscape || special != undefined)
		numKnives = Math.seededRandom(2,4);

	if(addSprings)
		numKnives += 3;
	
	
	var nKnives = 0;
	


	
	
	
	

	for(var pd = 1; pd < size / 2 && nKnives < numKnives; pd += 1){ //pd = perimeter depth - work round enemy in ever decreasing size perimeters
		var options = [];
		
		//add every possible point around the perimeter
		for(var al = pd; al < size - pd; al += 1){ //al = along length - how far down the length
			for(var ws = 0; ws < 4; ws += 1){ //ws = which side
				options.push([al,ws]);
			}
		}
		
		//e.g. if adding to right try adding to right of rightmost blocks at various different heights (options)
		//if can't find any rightmost block to add to right of then start moving inwards (increment pd)
		while(options.length > 0 && nKnives < numKnives){
			var ind = 0;
			if(options.length > 1)
				ind = Math.seededRandom(0, options.length - 1);
			var option = options[ind][0];
			var side = options[ind][1]
			options.splice(ind, 1);
			
			
			//1 = top, 2 = right, 3 = bottom, 4 = left
			var x, y;
			var nextoX, nextoY;
			
			if(side == 1){//start at top side, work downwards
				x = option;
				y = pd;
				nextoX = x;
				nextoY = y - 1;
			}
			else if(side == 2){//start at right side, work leftwards
				x = size - pd - 1;
				y = option;
				nextoX = x + 1;
				nextoY = y;					
			}
			else if(side == 3){
				y = size - pd - 1;
				x = option;
				nextoX = x;
				nextoY = y + 1;
			}
			else{
				x = pd;
				y = option;
				nextoX = x - 1;
				nextoY = y;					
			}
				

			if(enemyGrid[x][y] != undefined && enemyGrid[x][y].type == wallType){
				if(enemyGrid[nextoX][nextoY] == undefined){
					var type = "knife";
					if(special != undefined && (nKnives == 0 || (nKnives < numKnives - 1 && Math.seededRandomDouble() < 0.5 )))
						type = special;
					enemyGrid[nextoX][nextoY] = new TempBlock(type,nextoX,nextoY);
					if(addSprings && Math.seededRandomDouble() < springProb){
						enemyGrid[x][y] = new TempBlock("spring",nextoX,nextoY);
						enemyGrid[x][y].springStrength = Math.seededRandom(2,numSpeeds);
					}
					nKnives += 1;
				}
			}
		}
	}

	
	var heartAdded = false;
	while(blockArray.length > 0 && !heartAdded){
		var index = Math.seededRandom(0, blockArray.length - 1);
		var x = blockArray[index].myX;
		var y = blockArray[index].myY;
		
		//can't put heart where knife or other weapon is so only put if it is wall
		if(blockArray[index].type == wallType){
			//weighted = give higher probability that heart will be in centre
			//centrality should be almost 0 when at edge and 1 when at centre
			var centrality = Math.pow(Math.min((Math.min((size - x),x) / (size / 2)),(Math.min((size - y),y) / (size / 2))),4);
			
			if(Math.seededRandomDouble() < centrality){
				enemyGrid[x][y] = new TempBlock("heart",x,y);
				blockArray.splice(index,1);
				heartAdded = true;
			}
		}
		else
			blockArray.splice(index,1); //remove weapons from list of possible locations so don't try to overwrite weapon again
		
	}
	
	return enemyGrid;
}

//design enemy with motors
function designEnemyMotor(){
	//choose size of "core" of robot (i.e. bit without motors) that motors slide up and down
	var coreX = Math.seededRandom(2,numSpeeds);
	var coreY = Math.seededRandom(2,numSpeeds);
	
	var topY = 0;
	var leftX = 0;
	var rightX = 0;
	var bottomY = 0;
	
	var outermostBlocks = []; //actually layer *outside* outermost blocks for adding knives
	
	//try to attach motor on each side - I may have 1 to 4 motors
	if(Math.seededRandom(0,1) == 1)
		topY = Math.seededRandom(2,maxMotWidth);
	if(Math.seededRandom(0,1) == 1)
		leftX = Math.seededRandom(2,maxMotWidth);
	if(Math.seededRandom(0,1) == 1)
		rightX = Math.seededRandom(2,maxMotWidth);
	if(Math.seededRandom(0,1) == 1)
		bottomY = Math.seededRandom(2,maxMotWidth);
	
	//if haven't attached a motor to any side
	if(topY == 0 && leftX == 0 && rightX == 0 && bottomY == 0){
		var side = Math.seededRandom(1,4);
		if(side == 1)
			topY = Math.seededRandom(2,maxMotWidth);
		else if(side == 2)
			leftX = Math.seededRandom(2,maxMotWidth);
		else if(side == 3)
			rightX = Math.seededRandom(2,maxMotWidth);
		else
			bottomY = Math.seededRandom(2,maxMotWidth);
	}
	
	//overall size of the grid = max size in either direction
	var width = coreX + rightX + leftX;
	var height = coreY + topY + bottomY;
	var size = Math.max(width, height);
	
	var enemyGrid =[];
	for(var i =0; i < size; i+= 1){
		enemyGrid.push(new Array(size));
	};
	
	if(topY > 0)//grid, moveX, moveY,motorX,motorY,minLength,maxLength,thickness
		designMotor(enemyGrid, 0, -1,-1,topY - 1,leftX,width - rightX,topY,outermostBlocks); //add motor to top
	if(bottomY > 0)
		designMotor(enemyGrid, 0, 1,-1,height - bottomY,leftX,width - rightX,bottomY,outermostBlocks);	//add motor to bottom
	if(leftX > 0)
		designMotor(enemyGrid, -1, 0,leftX - 1,-1,topY, height - bottomY,leftX,outermostBlocks); //add motor to left
	if(rightX > 0)
		designMotor(enemyGrid, 1, 0,width - rightX,-1,topY, height - bottomY,rightX,outermostBlocks); //add motor to right
		
	//fill in grid for the core (bit between the motors)
	var gridSquares = []
	var i =0;
	for(var x =0; x < coreX; x += 1){
		for(var y =0; y < coreY; y += 1){
			enemyGrid[x + leftX][y + topY] = new TempBlock("wall",x + leftX,y + topY);
			gridSquares[i] = [x + leftX,y + topY]
			i += 1;
			
			//add places to add knives outside of perimeter where there isn't a motor blocking it
			if(topY == 0 && y == 0)
				outermostBlocks.push({x:(x + leftX), y:-1});
			if(bottomY == 0 && y == coreY - 1)
				outermostBlocks.push({x:(x + leftX), y:(coreY + topY)});
			if(leftX == 0 && x == 0)
				outermostBlocks.push({x:-1, y:(y+ topY)});
			if(rightX == 0 && x == coreX - 1)
				outermostBlocks.push({x:(coreX + leftX), y:(y+ topY)});
		}
	}
	
	//add heart
	var ind = Math.seededRandom(0,gridSquares.length - 1);
	var square = gridSquares.splice(ind,1)[0];
	
	var heartX = square[0];
	var heartY = square[1];
	
	//number of blocks surrounding heart
	var central = isWall(enemyGrid,heartX - 1,heartY) + isWall(enemyGrid,heartX - 1,heartY - 1) + isWall(enemyGrid,heartX,heartY - 1) + isWall(enemyGrid,heartX + 1,heartY + 1) + isWall(enemyGrid,heartX + 1,heartY)  + isWall(enemyGrid,heartX,heartY + 1) + isWall(enemyGrid,heartX - 1,heartY + 1) + isWall(enemyGrid,heartX + 1,heartY - 1);

	//make multiple attempts to put heart in centre to make chance of central heart more likely
	while(Math.seededRandom() < (central / 8) && gridSquares.length > 0){
		
		//choose squares at random or choose only square that we haven't tried yet
		square = []
		if(gridSquares.length == 1)
			square = gridSquares[0];
		else{
			ind = Math.seededRandom(0,gridSquares.length - 1);
			square = gridSquares.splice(ind,1)[0];
		}
		
		heartX = square[0];
		heartY = square[1];
		central = isWall(enemyGrid,heartX - 1,heartY) + isWall(enemyGrid,heartX - 1,heartY - 1) + isWall(enemyGrid,heartX,heartY - 1) + isWall(enemyGrid,heartX + 1,heartY + 1) + isWall(enemyGrid,heartX + 1,heartY)  + isWall(enemyGrid,heartX,heartY + 1) + isWall(enemyGrid,heartX - 1,heartY + 1) + isWall(enemyGrid,heartX + 1,heartY - 1);
	}
	
	enemyGrid[heartX][heartY] = new TempBlock("heart",heartX,heartY);
	

	//////////////////add extra knives
	////expand grid to fit them in
	size += 2;
	var newGrid =[];
	for(var x =0; x < size; x++){
		newGrid.push(new Array(size));
		if(x > 0 && x < size - 1){
			for(y = 1; y < size - 1; y++){
				newGrid[x][y] = enemyGrid[x-1][y-1];
			}
		}
	};
	enemyGrid = newGrid;
	//
	var numKnives = Math.seededRandom(0,5);
	for(i = 0; i < numKnives && outermostBlocks.length > 0; i++){
		var ind = Math.random(0,outermostBlocks.length - 1);
		var block = outermostBlocks.splice(ind,1)[0];
		enemyGrid[block.x + 1][block.y + 1] = new TempBlock("knife",block.x + 1,block.y + 1);
	}
	//////
	
	enemySize = size;
	
	return enemyGrid;
}

//moveX, moveY = direction moved as spread outwards (thickness wise) across rows of arm. NOT ultimate direction of travel.
//motorX, motorY = 
function designMotor(grid, moveX, moveY,motorX,motorY,minLength,maxLength,thickness,outermostBlocks){
	var pointX = 0;
	var pointY = 0;
	var potentialKnives = [];
	//pointX, pointY is direction arm actually points
	
	if(motorX == -1){ //if motor on top or bottom side
		if(Math.seededRandom()){
			pointX = 1;
			motorX = minLength;
		}
		else{
			motorX = maxLength - 1;
			pointX = -1;
		}
				
	}
	else if(motorY == -1){ //if motor on right or left side
		if(Math.seededRandom()){ 
			motorY = minLength; //top
			pointY = 1;			//pointing down
		}
		else{						
			motorY = maxLength - 1; //bottom
			pointY = -1;			//pointing up
		}	
	}
	var x = motorX;
	var y = motorY;
	grid[x][y] = new TempBlock("motor",x,y);
	
	var length = 0;
	var numRows = Math.min(3,thickness - 1)
	
	
	var maxL = maxLength - minLength - 1;
	var endLast = 0;
	var startLast = 0;
	var oldSt = 0;
	var oldEnd = 0;
	var st = 0;
	var end = 0;
	var maxEnd = 0;
	
	//x,y starts where the motor is
	for(var r = 0; r < numRows; r ++){
		x += moveX;//move outwards (thickness wise)
		y += moveY;
		
		var length = Math.seededRandom(1,maxL);
		

		
		//moving outwards first layer always starts from motor. Subsequent layers may start part way down previous layer
		if(r > 0){
			
			//new tier of arm is some subset of whole arms length
			st = Math.seededRandom(0,maxL-1); 
			end = Math.seededRandom(st+1, maxL);
			
			//if arm doesn't overlap with last tier make it do so
			if(st < oldSt && end <= oldSt)
				end = oldSt + 1;
			else if(st >= oldEnd && end > oldEnd)
				st = oldEnd - 1;
			length = end - st;
			
			oldSt = st;
			oldEnd = end;
			if(end > maxEnd)
				maxEnd = end;
			
			if(pointX != 0)
				x = pointX == 1 ? motorX + st: motorX - st;
			else
				y = pointY == 1 ? motorY + st: motorY - st;
			
		}
		else{
			oldSt = 0;
			oldEnd = length;
			end = length;
		}
				
		//move downwards along the arm
		for(var i =0 ; i < length; i+= 1){
			grid[x][y] = new TempBlock("wall",x,y);
			if(r == numRows-1){ //point just outside blocks on outermost tier saved for adding extra knives to
				outermostBlocks.push({x:(x + moveX),y:(y + moveY)});
			}

			x += pointX;
			y += pointY;
		}
		grid[x][y] = new TempBlock("knife",x,y);
		potentialKnives.push({x,y,end});
	}
	
	//remove some knives further back
	for(let k of potentialKnives){
		if(Math.seededRandom() < Math.seededRandom((maxEnd - k.end)/maxEnd))
			grid[k.x][k.y] = null;
	}
	
	

}
function union(setA, setB) {
    let _union = new Set(setA)
    for (let elem of setB) {
        _union.add(elem)
    }
    return _union
}

function isWall(grid,x,y){
	if(x < 0 || x >= grid[0].length || y < 0 || y >= grid[0].length)
		return 0;
	if(grid[x] == undefined || grid[x] == null || grid[x][y] == undefined || grid[x][y] == null)
		return 0;
	if(grid[x][y].type == "wall")
		return 1;
	else 
		return 0;
	
	
}


function addSquareArea(grid, stX,stY,sizeX,sizeY,neighbours,squareList, edgeList, heart){
	var newNeigh = new Set();
	
	var overlapsSomething = false;
	var numAdded = 0;
	var numAddedToEdge = 0;
		
	//add the blocks
	for(var x = 0; x < sizeX; x+= 1){
		for(var y = 0; y < sizeY; y+= 1){
			if(grid[stX + x][stY + y] == null){ 
				if (y == 0 || y == sizeY - 1 || x == 0 || x == sizeX - 1){
					edgeList[edgeList.length] = [stX + x,stY + y];
					numAddedToEdge += 1;
				}
				grid[stX + x][stY + y] = new TempBlock("wall",stX + x,stY + y);			
				squareList[squareList.length] = [stX + x, stY + y];
				numAdded += 1;
			}
			else
				overlapsSomething = true;
		}		
	}
	
	//walk round just outside perimeter (ignoring corners) to identify neighbours
	//top, right, bottom, left
	var topI = 0;
	var rightI = 0;
	var bottomI = 0;
	var leftI = 0;
	var x = stX - 1;
	var y = stY - 1;
	while(leftI < sizeY){
		if(topI < sizeX){
			topI += 1;
			x += 1;
		}
		else if(rightI < sizeY){
			rightI += 1;
			x = stX + sizeX;
			y += 1;
		}
		else if(bottomI < sizeX){
			bottomI += 1;
			y = stY + sizeY;
			x -= 1;
		}
		else{
			leftI += 1;
			x = stX - 1;
			y -= 1;
		}
		if(grid[x][y] != null){
			if(grid[x][y].neigh != undefined) //another internal block - with links to it's own side
				newNeigh = union(newNeigh,grid[x][y].neigh)
			else if(grid[x][y].side != undefined) //another side block
				newNeigh = union(newNeigh,neighbours[grid[x][y].side])
			overlapsSomething = true;
		}
	}
	
	//if overlaps nothing then just get rid and return
	if(!overlapsSomething){
		for(var i = 0; i < numAdded; i+= 1){
			var sqPos = squareList[squareList.length - i - 1];
			grid[sqPos[0]][sqPos[1]] = null;
		}
		squareList.splice(squareList.length - numAdded,numAdded);

		edgeList.splice(edgeList.length - numAddedToEdge,numAddedToEdge);
		
		return newNeigh;
	}


	//walk round just inside perimeter to mark on my blocks who my neigbours are:
		//later squares can figure out I'm there neighbour
	if(sizeX == 1){
		for(var i = 0; i < sizeX; i+= 1)
			grid[stX + i][stY].neigh = newNeigh //another side block
	}
	else if(sizeY == 1){
		for(var i = 0; i < sizeY; i+= 1)
			grid[stX][stY + i].neigh = newNeigh //another side block
	}
	else{
		topI = 0;
		rightI = 0;
		bottomI = 0;
		leftI = 0;
		x = stX;
		y = stY;
		while(leftI < sizeY - 1){
			grid[x][y].neigh = newNeigh //another side block
			grid[x][y].neigh = newNeigh //another side block
			if(topI < sizeX - 1){
				topI += 1;
				x += 1;
			}
			else if(rightI < sizeY - 1){
				rightI += 1;
				y += 1;
			}
			else if(bottomI < sizeX - 1){
				bottomI += 1;
				x -= 1;
			}
			else{
				leftI += 1;
				y -= 1;
			}
	
		}
	}

	//add heart if it's the biggest square
	var totalSize = sizeX * sizeY;
	if(heart.starter || (totalSize > heart.gridSize && Math.seededRandomDouble() < heartInBiggestProb)){
		var centerX = sizeX/2;
		var centerY = sizeY/2;
		if(sizeX % 2 == 0)
			centerX -= Math.seededRandom(0,1);
		else
			centerX = Math.floor(centerX);
		if(sizeY % 2 == 0)
			centerY -= Math.seededRandom(0,1);
		else
			centerY = Math.floor(centerY);
		
		grid[centerX + stX][centerY + stY] = new TempBlock("heart",centerX + stX,centerY + stY);
		
		//clear the old
		if(!heart.starter)
			grid[heart.x][heart.y] = new TempBlock("wall",heart.x,heart.y);
		heart.gridSize = totalSize;
		heart.x = centerX + stX;
		heart.y = centerY + stY;
		heart.starter = false;
	}
	
	return newNeigh;
}


