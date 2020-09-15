'use strict';

const {eventLoopUtilization} = require('perf_hooks').performance;

const _defaultOptions = {
	target: 0.2, // the ideal value of the measurement
	scaleUp: 0.5, // scale up slowly to reach the target
	scaleDown: 2, // scale down, overshooting the target - going over is bad
	scaleMax: 10, // scale up by 10x at most
	scaleMin: 0.01, // scale down by 99.9% at most
	metric: makeELUMetric()
};

function makeELUMetric(){
	let _lastPerfCall = undefined;
	return function(){
		if(eventLoopUtilization===undefined) throw new Error('Using Event-loop utilization requires Node 14.10+');
		_lastPerfCall = eventLoopUtilization(_lastPerfCall);
		return _lastPerfCall.utilization;
	}
}

// Return values from loadAdjuster() will extend this.
const genericAdjustment = {
	// Recommended load scale factor
	scale: 1,
	// This scale will take you all the way to the target
	// Could be 0, could be infinity.
	rawScale: 1,
	// Here's the measurement this was based on - good for logging
	measurement: 1,
	// Wanna treat this object as JSON? you can!
	toJSON: function(){return {scale:this.scale, rawScale:this.rawScale, measurement:this.measurement}},
	// Wanna treat this object as a number? you can!
	valueOf: function(){return this.scale},
	// Wanna treat this object as a string? you can!
	toString: function(){return this.toJSON().toString()}
};

function createAdjuster(_options){

	let options = Object.assign({}, _defaultOptions, _options);

	return function(measurement){
		// Where are we?
		if(measurement===undefined){
			measurement = options.metric();
		}

		// Where do we need to go (from here)?
		const rawDistance = options.target - measurement;

		// Can I get that as a percentage of where we are?
		const rawScale = rawDistance / measurement + 1;

		// We probably don't want to jump that entire distance right now
		// Introducing: the scaleScale^(tm)!
		let scaleScale = 1;
		if(rawScale > 1) scaleScale = options.scaleUp;
		if(rawScale < 1) scaleScale = options.scaleDown;

		// Scale the rawScale by the scaleScale^(tm)
		// "Scale" doesn't look like a real word anymore :(
		let scale = ((rawScale-1)*scaleScale)+1;

		// Don't attempt to increase the load by too much
		scale = Math.min(scale, options.scaleMax);

		// Don't attempt to decrease the load by too much
		scale = Math.max(scale, options.scaleMin);

		// Extend our response object
		const adjustment = Object.create(genericAdjustment);

		// Populate them fields
		adjustment.scale = scale;
		adjustment.rawScale = rawScale;
		adjustment.measurement = measurement;

		// Here ya go!
		return adjustment;
	}
}

module.exports = {
	createAdjuster
};
