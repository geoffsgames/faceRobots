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
//TODO - smaller motor enemies, but will need to be designed in a completely different way

var probMotorFullLength = 0.5;
var enemyKnifeProb = 0.2;

var heartInBiggestProb = 0.95;

var springProb = 0.6;


designEnemy = function(initialLandscape, addSprings, special){
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





designMotor = function(grid, baseX, baseY, movX, movY, gridSize, sideNum, edgeList){
	
	//boolean
	var fullLength = Math.seededRandomDouble() < probMotorFullLength;
	
	var motorLength = Math.seededRandom(2,numSpeeds);
	if(fullLength)
		motorLength = numSpeeds + 1;
	
	var leftwardsUpwards = Math.seededRandomDouble() > 0.5; //meaning depends on orientation of motor: pointing leftwards if motor at top or bottom, pointing upwards if motor at left or right
	
	var pointX = 0;
	var pointY = 0;	
	
	if(baseX == -1){ //top or bottom moving l/r so the x coord is variable
		//pointing left
		baseX = motorLength - 1 + 3; //+2 and -2 below to remind me - leave a gap because guy coming up adjacent side might need to indepth his base by 2
		pointX = -1;
		if(!leftwardsUpwards){//pointing right
			baseX = gridSize - motorLength - 1 - 3;
			pointX = 1;
		}
		
		//ensure doesn't go off (or within 3) of edge of grid
		if(leftwardsUpwards && baseX >= gridSize - 3){
			motorLength -= ((baseX - (gridSize - 3)) + 1)
			baseX = gridSize -3
		}
		else if(!leftwardsUpwards && baseX < 3){
			motorLength -= (3 - baseX)
			baseX = 3
		}
	}
	else if(baseY == -1){ //left or right moving t/b so the y coord is variable
		baseY = motorLength - 1 + 3;
		pointY = -1;
		if(!leftwardsUpwards){
			baseY = gridSize - motorLength - 1 - 3;
			pointY = 1;
		}
		
		//ensure doesn't go off (or within 3) of edge of grid
		if(leftwardsUpwards && baseY >= gridSize - 3){
			motorLength -= ((baseY - (gridSize - 3)) + 1)
			baseY = gridSize -3
		}
		else if(!leftwardsUpwards && baseY < 3){
			motorLength -= (3 - baseY)
			baseY = 3
		}

	}
	
	var neighbours = new Set();
	neighbours.add(sideNum);



	//the motor
	grid[baseX + movX][baseY + movY] = new TempBlock("motor",baseX + movX,baseY + movY);
	grid[baseX + movX][baseY + movY].side = sideNum;
	
	var armStartX = baseX + (movX * 2);
	var armStartY = baseY + (movY * 2);
	
	//the moving arm
	var lengthArm = Math.seededRandom(2,motorLength);
	for(var i =0; i < lengthArm; i+= 1){
		var x = armStartX + (i * pointX);
		var y = armStartY + (i * pointY);
		if(i == lengthArm - 1)
			grid[x][y] = new TempBlock("knife",x,y);
		else{
			grid[x][y] = new TempBlock("wall",x,y);
			edgeList[edgeList.length] = [x, y];
		}
	}
	
	//the runway
	for(var i =0; i < motorLength; i+= 1){
		var x = baseX + (i * pointX);
		var y = baseY + (i * pointY)
		
		//found connection to another side
		if(grid[x][y] != null && grid[x][y].side != undefined){
			neighbours.add(grid[x][y].side);
		}
		else{
			if(grid[x][y] != null && grid[x][y].side != undefined){
				neighbours.add(grid[x][y].side);
			}
			grid[x][y] = new TempBlock("wall",x,y);
			
			grid[x][y].side = sideNum;
		}
	}
	
	//check 1 beyond for connections
	var x = baseX + (motorLength * pointX);
	var y = baseY + (motorLength * pointY);
	if(grid[x][y] != null && grid[x][y].side != undefined){
		neighbours.add(grid[x][y].side);
	}
	x = baseX + (-1 * pointX);
	y = baseY + (-1 * pointY);
	if(grid[x][y] != null && grid[x][y].side != undefined){
		neighbours.add(grid[x][y].side);
	}
	
	return neighbours;

}

function union(setA, setB) {
    let _union = new Set(setA)
    for (let elem of setB) {
        _union.add(elem)
    }
    return _union
}

designEnemyMotor = function(){
	
	gridSize = Math.seededRandom(minEnemyMotorGrid, maxEnemyMotorGrid);
	enemyGrid =[];
	for(var i =0; i < gridSize; i+= 1){
		enemyGrid.push(new Array(gridSize));
	};

	
	var numMotors = Math.seededRandom(1, 4);
	var sides = [1,2,3,4]; 
	var sidesCovered = [];
	var neighbours = [new Set(), new Set(), new Set(), new Set()];
	
	var edgeList = Array();

	
	for(var i =0; i < numMotors; i+= 1){
		var sideInd = Math.seededRandom(0,sides.length - 1);
		if (sides.length == 1)
			side = sides[0];
		else
			side = sides.splice(sideInd,1)
		dir = Math.seededRandom(1,2);
		if(side == 1){//top
			//baseX, baseY, movX, movY
			neighbours[0] = designMotor(enemyGrid, -1, 3, 0, -1, gridSize, 0, edgeList);
			sidesCovered[sidesCovered.length] = 0;
		}
		else if(side == 3){//bottom
			neighbours[1] = designMotor(enemyGrid, -1, gridSize - 4, 0, 1, gridSize, 1, edgeList);
			sidesCovered[sidesCovered.length] = 1;
		}
		else if(side == 4){//left
			neighbours[2] = designMotor(enemyGrid, 3, -1, -1, 0, gridSize, 2, edgeList);
			sidesCovered[sidesCovered.length] = 2;

		}
		else{//right
			neighbours[3] = designMotor(enemyGrid, gridSize - 4, -1, 1, 0, gridSize, 3, edgeList);
			sidesCovered[sidesCovered.length] = 3;

		}

	};

	

	//combine the records of which arms are connected so that each entry in neighbours contains EVERY neighbour
	var change = true;
	while(change){
		change = false;
		for(var n = 0; n < neighbours.length; n += 1){
			for (let n2 of neighbours[n]){
				var size1 = neighbours[n2].size;
				neighbours[n2] = union(neighbours[n],neighbours[n2]);
				if(neighbours[n2].size > size1)
					change = true;
			}
		}
	}

	sides = sidesCovered; 
	
	var sqList = Array();
	
//	enemyGrid[0][0] = new TempBlock("heart",0,0);

	var sideInd = 4;
	var heart = {starter: true};
	
	do{ //while not all connected
		if(sides.length == 1){
			side = sides[0];
			sides = sidesCovered;
		}
		else{
			var sideInd = Math.seededRandom(0,sides.length - 1);
			side = sides.splice(sideInd,1);
		}
		
		var sqX = 3
		var sqY = 3
		sqAttachSide = side;
		var sqLongside = Math.seededRandom(3, gridSize - 6)
		var sqShortside = Math.seededRandom(1,4);
		
		if(sqAttachSide == 1){ //top side
			sqX = Math.seededRandom(3, gridSize - sqShortside - 3);
			//sqY stay 2
		}
		else if(sqAttachSide == 2){ //bottom
			sqX = Math.seededRandom(3, gridSize - sqShortside - 3);
			sqY = gridSize - sqLongside - 3;
		}
		else if(sqAttachSide == 3){
			sqY = Math.seededRandom(3, gridSize - sqShortside - 3);
		}
		else{
			sqY = Math.seededRandom(3, gridSize - sqShortside - 3);
			sqX = gridSize - sqLongside - 3;
		}
		var sizeX = sqLongside;
		var sizeY = sqShortside;
		if(sqAttachSide < 3){
			sizeX = sqShortside;
			sizeY = sqLongside;
		}
		var neigh2 = addSquareArea(enemyGrid, sqX,sqY,sizeX,sizeY, neighbours, sqList, edgeList, heart);
		for (let n of neigh2){
			neighbours[n] = union(neighbours[n],neigh2);
			neigh2 = union(neigh2,neighbours[n]);
		}

		sideInd += 1;
	}while((neigh2.size < numMotors)|| Math.seededRandomDouble(0,1) < 0.1)
	
		
		/** OLD METHOD
	//add in the face/heart
	var faceX =  0;
	var faceY = 0;
	var dirX = (Math.seededRandom(0,1) * 2) - 1;
	var dirY = (Math.seededRandom(0,1) * 2) - 1;
	var placedHeart = false;
	while(!placedHeart){
		if(sqList.length == 1){
			placedHeart = true;
			var sqPos = sqList[0];
			var sqX = sqPos[0];
			var sqY = sqPos[1];
			enemyGrid[sqX][sqY] = new TempBlock("heart",sqX,sqY);
		}
		else{
			var sqPos = sqList.splice(Math.seededRandom(0,sqList.length - 1),1)[0];
			var sqX = sqPos[0];
			var sqY = sqPos[1];
			var enclosedScore = 0;
			
			for(var i = -3; i < 3; i+= 1){
				if(i == 0) //skip 0 as that's my block
					i += 1;
				enclosedScore += isWall(enemyGrid,sqX, sqY + i);
				enclosedScore += isWall(enemyGrid,sqX + i, sqY);
				enclosedScore += isWall(enemyGrid,sqX + i, sqY + i);
				enclosedScore += isWall(enemyGrid,sqX - i, sqY + i);
	
			}
			//max score for enclosedScore = 6 * 4 = 24
			
			var centreScore = Math.min(Math.min(sqX,(gridSize - sqX)),Math.min((gridSize - sqY),sqY));
			if(centreScore > 2 || Math.seededRandom() < 0.2){ //odds of putting at edge very low
				placedHeart = Math.seededRandomDouble() < enclosedScore / 24;
				if(placedHeart)
					enemyGrid[sqX][sqY] = new TempBlock("heart",sqX,sqY);
			}
		
		}	
		
	}
	*/
	
	//add on any extra knives
	while(edgeList.length > 1){
		var sqPos = edgeList.splice(Math.seededRandom(0,edgeList.length - 1),1)[0];
		var sqX = sqPos[0];
		var sqY = sqPos[1];


		
		//topside - see if uncovered and can potentially add a knife
		var foundBlock = false;
		var i =1;
		while(sqY - i  >= 0 && !foundBlock){
			if (enemyGrid[sqX][sqY - i] != undefined && enemyGrid[sqX][sqY - i] != null)
				foundBlock = true;
			i = i + 1;
		}
		if(!foundBlock && Math.seededRandomDouble() < enemyKnifeProb) //uncovered
			enemyGrid[sqX][sqY - 1] = new TempBlock("knife",sqX,sqY - 1);
		
		//bottomside - see if uncovered and can potentially add a knife
		foundBlock = false;
		i = 1;
		while(sqY + i < gridSize && !foundBlock){
			if (enemyGrid[sqX][sqY + i] != undefined && enemyGrid[sqX][sqY + i] != null)
				foundBlock = true;
			i = i + 1
		}
		if(!foundBlock && Math.seededRandomDouble() < enemyKnifeProb) //uncovered
			enemyGrid[sqX][sqY + 1] = new TempBlock("knife",sqX,sqY + 1);
		
		
		
		//leftside - see if uncovered and can potentially add a knife
		foundBlock = false;
		i =1;
		while(sqX - i  >= 0 && !foundBlock){
			if (enemyGrid[sqX - i][sqY] != undefined && enemyGrid[sqX - i][sqY] != null)
				foundBlock = true;
			i = i + 1;
		}
		if(!foundBlock && Math.seededRandomDouble() < enemyKnifeProb) //uncovered
			enemyGrid[sqX - 1][sqY] = new TempBlock("knife",sqX - 1,sqY);
		
		//rightside - see if uncovered and can potentially add a knife
		foundBlock = false;
		i = 1;
		while(sqX + i < gridSize && !foundBlock){
			if (enemyGrid[sqX + i][sqY] != undefined && enemyGrid[sqX + i][sqY] != null)
				foundBlock = true;
			i = i + 1
		}
		if(!foundBlock && Math.seededRandomDouble() < enemyKnifeProb) //uncovered
			enemyGrid[sqX + 1][sqY] = new TempBlock("knife",sqX + 1,sqY);
	}

	return enemyGrid;
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
	newNeigh = new Set();
	
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
			sqPos = squareList[squareList.length - i - 1];
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
