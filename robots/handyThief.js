HandyThief.prototype = new Enemy();        
HandyThief.prototype.constructor=HandyThief;

function HandyThief(myX, myY, facing) {
	this.setup(myX, myY, facing);
}

HandyThief.prototype.setup = function(myX, myY, facing){
	Enemy.prototype.setup.call(this,myX, myY, facing);	


}