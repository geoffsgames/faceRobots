Math.maybeSeededRandom = function(min, max) {
	if(randsSeeded){
		return Math.seededRandomDouble(min,max);
	}
	else{
		return (Math.random() * (max - min)) + min;
	}
}


//from http://indiegamr.com/generate-repeatable-random-numbers-in-js/
//Math.round() added and max and min swapped to make it easier for me to think about

//in order to work 'Math.seed' must NOT be undefined,
//so in any case, you HAVE to provide a Math.seed
Math.seededRandom = function(min, max) {

	return Math.round(Math.seededRandomDouble(min,max));
};

Math.seededRandomDouble = function(min,max){
	 max = max || 1;
	 min = min || 0;
	 Math.seed = (Math.seed * 9301 + 49297) % 233280;
	 var rnd = Math.seed / 233280;
	 return min + rnd * (max - min);

};