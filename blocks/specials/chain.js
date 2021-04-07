"use strict";
//Chain//////////////////////////////////////////////////////////////////////////////////////////////
//Only partially integrated - chains to move motors at the same time

Chain.prototype = new Block();
Chain.prototype.constructor=Chain;
function Chain(type, ownerGrid, ownerImage,  owner, myX, myY, offsetX, offsetY, pointX, pointY){
	Block.prototype.setup.call(this, type, ownerGrid, ownerImage,  owner, myX, myY, offsetX, offsetY, pointX, pointY);
	this.special = true; //block better than regular knife or wall - block worth announcing!
	this.resistance = 2;
}

//if removing this block will leave a gap (this block is a bridge)
Person.prototype.linkChainRecursive = function(x,y, motList, chainList){
	
	if(x <= this.maxX && x >= this.minX && y <= this.maxY && y >= this.minY && this.grid[x][y] != undefined && this.grid[x][y] != null){
		var square = this.grid[x][y];
		if(square.type == "motor" && !square.chainVisited){
			square.chainVisited = true;
			motList.push(square);
			if(chainList.length == 0){//is starting motor
				this.linkChainRecursive(x+1,y, motList, chainList);
				this.linkChainRecursive(x-1,y, motList, chainList);
				this.linkChainRecursive(x,y+1, motList, chainList);
				this.linkChainRecursive(x,y-1, motList, chainList);
			}
		}
		else if(square.type == "chain" && !square.chainVisited && (square.motor == undefined || square.motor == null || !square.motor.moving)){
			square.chainVisited = true;
			chainList.push(square);
			this.linkChainRecursive(x+1,y, motList, chainList);
			this.linkChainRecursive(x-1,y, motList, chainList);
			this.linkChainRecursive(x,y+1, motList, chainList);
			this.linkChainRecursive(x,y-1, motList, chainList);
		}
	}

};

Person.prototype.linkChain = function(chainX, chainY){
	var motList = new Array();
	var chainList = new Array();
	this.linkChainRecursive(chainX,chainY,motList,chainList);
	
	for(var i =0; i < chainList.length; i+= 1){
		chainList[i].chainVisited = false;
	}
	return motList;
};

