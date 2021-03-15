var P2P = null;
var io = null;
var socket2 = null;

function init(){
    var P2P = require('socket.io-p2p');
    var io = require('socket.io-client');
    var socket2 = io();
}

function sendKeyPress(key,doubleclick){
    if(P2P == undefined || P2P == null)
        return;
    var p2psocket = new Socketiop2p(socket2, opts, function () {
        p2psocket.emit('key-press', {key:key, dc:doubleclick})
    })
}
  
p2psocket.on('key-press', function (msg) {
     changeStateEnemy(msg.key,msg.dc);
})


//see changeState(...) in display
function changeStateEnemy(code,doubleclick){
	code = enemy.convertCode(code);
    if(code== "left"){
        //keyCode 37 is left arrow
        enemy.willSetMovement(-1,0,doubleclick);
    }
    else if(code== "right"){
        //keyCode 39 is right arrow
        enemy.willSetMovement(1,0,doubleclick);
    }
    else if(code== "up"){
        //keyCode 38 is up arrow
    	enemy.willSetMovement(0,-1,doubleclick);
    }
    else if(code== "down"){
        //keyCode 40 is down arrow
    	enemy.willSetMovement(0,1,doubleclick);
    }
    else if(code == "anticlockwise"){
    	//shift
    	if(enemy.willFinishRotating == -1)
    		enemy.willRotate = -1;//anti-clockwise
    }
    else if(code == 32){ //space
    	if(enemy.movX != 0 || enemy.movY != 0)
    		enemy.willStop = true;
    }
    else if(code >= 49 && code <= 58){ //numbers
		  stoppedPressingMotor = false;
    	enemy.motorWillStart = code - 49;
    }
    else if(code==13){
    	//enter
    	if(enemy.willFinishRotating == -1)
    		enemy.willRotate =1;//clockwise
    }
}
