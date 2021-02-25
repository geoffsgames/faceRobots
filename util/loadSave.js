//just for diagnostic (for now)

var loading = false;
var saving = false;
var enemyStr;
var enemyInt;
var playerStr;
var changedBlocks;
var saveGameInterval = 50;
var changedBlocks = new Array();

if(typeof(Storage)=="undefined")
  {
		alert("game saving not supported!");
  }

function loadGame(){
	playerStr = localStorage.getItem('player');
	if(playerStr != null){	
		enemyStr = localStorage.getItem('enemy');
		//so enemy restores with same time til next AI decision
		enemyInt = parseInt(localStorage.getItem('enemyAIcountDown'));
		//for reproducing same landscape
		curSeed = parseFloat(localStorage.getItem('curSeed'));
		globalSeed = parseFloat(localStorage.getItem('globalSeed'));
		var numEnemies = parseInt(localStorage.getItem('numEnemies'));
		//changedBlocks
		makeBlockArray(localStorage.getItem('landChanged'));
		timeStamp = parseInt(localStorage.getItem('timeSaved')) - 1;
		Math.seed = parseFloat(localStorage.getItem('seed'));
	}
	else{
		alert("No game saved");
	}
}

function saveGame(){
	localStorage.setItem('player',player.textGrid.length + "s" + player.textGrid + "_" + player.myX + "_" + player.myY + "_" + player.movX + "_" + player.movY + "_" + player.facing);
	localStorage.setItem('enemy',enemy.textGrid.length + "s" + enemy.textGrid + "_" + enemy.myX + "_" + enemy.myY + "_" + enemy.movX + "_" + enemy.movY + "_" + enemy.facing);
		
	localStorage.setItem('curSeed',curSeed);
	localStorage.setItem('globalSeed',globalSeed);

	localStorage.setItem('landChanged',land.changedBlocks);
	localStorage.setItem('numEnemies',land.totalNumEnemies);
	
	localStorage.setItem('timeSaved', timeStamp);
	localStorage.setItem('seed', Math.seed);
	
	localStorage.setItem('enemyAIcountDown', enemy.AIcountDown);
}

function makeBlockArray(arrayStr){
	var bits = arrayStr.split(",");
	//one element (block) in bits
	//[0] = x
	//[1] = y
	//[2] = damage
	for(var i =0; i < bits.length; i += 3){
		changedBlocks.push([parseInt(bits[i]), parseInt(bits[i + 1]), parseInt(bits[i + 2])]);
	}
}
