'use strict';

const thingAdjuster = require('./index.js');
const adjuster = thingAdjuster.createAdjuster({
	target: 1,     // We strive for 100% hippo satisfaction
	scaleUp: 1.1,  // Scale up dramatically, because sad hippos are sad
	scaleDown: 0.9 // Scale down quickly, so they don't get fat or sad
});

const hippos = 10;
const hippoHunger = 1;
let food = 1; // The last zookeeper didn't do a good job.

function howHappyAreMyHippos(){
	// Hippo hunger varies by up to 10% per day
	return food / (hippos*hippoHunger*((Math.random()-0.5)/10+1));
}

function feedTheHippos(){
	const foodAdjustment = adjuster(howHappyAreMyHippos());
	food *= foodAdjustment;
	console.log(
		`Adjusted food by ${Math.round(foodAdjustment*100)}% due to `+
		`Hippo satisfaction of ${foodAdjustment.measurement.toFixed(2)}`
	);
	setTimeout(feedTheHippos, 500);
}
feedTheHippos();
