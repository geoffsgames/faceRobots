//diagnostic - replaying game

var replayStr = 
"7:40game.js:368:4\n"+
"17:37game.js:368:4\n"+
"19:37game.js:368:4\n"+
"20:38game.js:368:4\n"+
"23:37game.js:368:4\n"+
"27:40game.js:368:4\n"+
"29:40game.js:368:4\n"+
"32:39game.js:368:4\n"+
"35:40game.js:368:4\n"+
"37:37game.js:368:4\n"+
"45:38game.js:368:4\n"+
"50:37game.js:368:4\n"+
"59:40game.js:368:4\n"+
"62:39game.js:368:4\n"+
"64:38game.js:368:4\n"+
"67:37game.js:368:4\n"+
"72:38game.js:368:4\n"+
"74:39game.js:368:4\n"+
"77:40game.js:368:4\n"+
"81:37game.js:368:4\n"+
"83:40game.js:368:4\n"+
"89:39game.js:368:4\n"+
"95:37game.js:368:4\n"+
"99:38game.js:368:4\n"+
"106:39game.js:368:4\n"+
"111:40game.js:368:4\n"+
"115:38game.js:368:4\n"+
"123:39game.js:368:4\n"+
"130:40game.js:368:4\n"+
"139:39game.js:368:4\n"+
"142:38game.js:368:4\n"+
"144:37game.js:368:4\n"+
"163:40game.js:368:4\n"+
"172:37game.js:368:4\n"+
"177:40game.js:368:4\n"+
"181:38game.js:368:4\n"+
"188:39game.js:368:4\n"+
"193:38game.js:368:4\n"+
"197:40game.js:368:4\n"+
"205:13game.js:368:4\n"+
"207:13game.js:368:4\n"+
"208:13game.js:368:4\n"+
"219:39game.js:368:4\n"+
"222:37game.js:368:4\n"+
"226:38game.js:368:4\n"+
"232:40game.js:368:4\n"+
"249:38game.js:368:4\n"+
"253:40game.js:368:4\n"+
"254:39game.js:368:4\n"+
"261:40game.js:368:4\n"+
"267:38game.js:368:4\n"+
"270:37game.js:368:4\n"+
"277:13game.js:368:4\n"+
"281:38game.js:368:4\n"+
"291:39game.js:368:4\n"+
"296:40game.js:368:4\n"+
"301:38game.js:368:4\n"+
"312:37game.js:368:4\n"+
"314:40game.js:368:4\n"+
"315:39game.js:368:4\n"+
"319:39game.js:368:4\n"+
"323:40game.js:368:4\n"+
"327:37game.js:368:4\n"+
"337:40game.js:368:4\n"+
"355:39game.js:368:4\n"+
"359:39game.js:368:4\n"+
"360:39game.js:368:4\n"+
"361:39game.js:368:4\n"+
"369:38game.js:368:4\n"+
"372:37game.js:368:4\n"+
"403:39game.js:368:4\n"+
"408:40game.js:368:4\n"+
"410:39game.js:368:4\n"+
"423:38game.js:368:4\n"+
"436:40game.js:368:4\n"+
"442:39game.js:368:4\n"+
"451:38game.js:368:4\n"+
"461:39game.js:368:4\n"+
"469:38game.js:368:4\n"+
"479:37game.js:368:4\n"+
"505:38game.js:368:4\n"+
"512:39game.js:368:4\n"+
"521:40game.js:368:4\n"+
"528:39game.js:368:4\n"+
"533:40game.js:368:4\n"+
"536:39game.js:368:4\n"+
"545:38game.js:368:4\n"+
"555:37game.js:368:4\n"+
"562:39game.js:368:4\n"+
"568:40game.js:368:4\n"+
"574:37game.js:368:4\n"+
"578:40game.js:368:4\n"+
"582:37game.js:368:4\n"+
"597:32game.js:368:4\n"+
"726:addpiece7s0,0,0,0,0,0,0,0,knife.2,knife.2,0,0,0,0,0,heart.1,wall.1,knife.2,0,0,0,0,wall.1,0,wall.1,0,0,0,0,wall.1,wall.1,wall.1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0gameplayer.js:347:2\n"+
"726:37game.js:368:4\n"+
"778:39game.js:368:4";

//ERROR 16/10 - 401
//for replaying saved game
var nextTime = 0;
var codes = [];
var times = [];
var playingBack = false;

getCodes();             

function getCodes(){
	var strs = replayStr.split("\n");
	
	for(var i =0; i < strs.length; i++){
		var bits = strs[i].split("game")[0].split(":");
		times.push(parseInt(bits[0]));
		codes.push(bits[1]);
		
	}
}
