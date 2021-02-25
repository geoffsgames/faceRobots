HandyThief2.prototype = new Thief();        
HandyThief2.prototype.constructor=HandyThief2;

function HandyThief2(myX, myY, facing) {
	this.setup(myX, myY, facing);
}

HandyThief2.prototype.setup = function(myX, myY, facing){
	alert("WHAT THE FUCK IS YOUR PROBLEM2?!?!");
	Thief.prototype.setup.call(this,myX, myY, facing);	


}