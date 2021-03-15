function sendKeyPress(key,doubleclick){
    if(enemy.isEnemy) //not playing PVP
        return;
    socket.emit('key-press', {key:key, dc:doubleclick, rID:uniqueID})
}
  
socket.on('receiveKey-press', function (msg) {
     if(msg.rID != rivalID)
	return;
     alert("enemy keypress");
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
