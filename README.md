# thing-adjuster

Adjust your workload based on event loop utilization. Adjust the hippo food based on hippo satisfaction rate. Adjust any variable based on any metric. Keep the hippos happy.

## Overview

By default, `thing-adjuster` will measure Node's event-loop utilization, and tell you how much you can *scale* your workload by.

You can change the metric `thing-adjuster` measures, or even measure something yourself. Then, `thing-adjuster` will tell you how to scale *anything* that influences metric to reach a goal.

## Installation

```sh
npm install thing-adjuster
```

```js
const thingAdjuster = require('thing-adjuster');
```

## Basic use

**Quick Start**

This tiny example scales a workload based on the utilization of Node's event loop.

```js
const thingAdjuster = require('thing-adjuster');
const adjuster = thingAdjuster.createAdjuster();

const workload = 100;

function doWork(){
	// adjust the workload
	workload *= adjuster();
	// Do the work - could be anything.
	// Could be something like `sendThisManyHttpRequests(workload)`
	for(let i=0; i<workload; i++){}
	// Do it again later
	setTimeout(doWork, 100);
}
doWork();
```

**Less-Quick Start**

This example shows how we can:

- Use advanced options,
- Use the return value of `adjuster()`, and
- Use a custom metric

```js
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
```

This code produces:

```
Adjusted food by 1000% due to Hippo satisfaction of 0.10
Adjusted food by 105% due to Hippo satisfaction of 0.95
Adjusted food by 96% due to Hippo satisfaction of 1.04
Adjusted food by 100% due to Hippo satisfaction of 1.00
Adjusted food by 99% due to Hippo satisfaction of 1.01
Adjusted food by 96% due to Hippo satisfaction of 1.05
Adjusted food by 102% due to Hippo satisfaction of 0.99
Adjusted food by 106% due to Hippo satisfaction of 0.95
Adjusted food by 98% due to Hippo satisfaction of 1.03
```

**Why is this useful?**

What if the hippo satisfaction function wasn't known? What if the zoo suddenly doubles in hippo population? What if the hippos don't eat as much when it's hot outside? What if I'm sending http requests, and the server starts sending back lots of data?

If you have a variable that needs to dynamically change to whatever real-world conditions may come your way, then `thing-adjuster` is for you.

## API

### `createAdjuster([options])` &rarr; `adjuster`

```js
let myAdjuster = createAdjuster({
	target: 0.2,
	scaleUp: 0.5,
	scaleDown: 2,
	scaleMax: 10,
	scaleMin: 0.01,
	// metric: a function that returns a number. Default: ELU (Node 14.10+)
});
```

This creates a new `adjuster` function. You can make as many as you want.

All options are optional.

Property | Description | Type | Default
---------|-------------|------|--------
`target`   | The ideal value of the metric | `number` | 0.2
`scaleUp` | How aggressively to adjust upwards | `number` | 0.5
`scaleDown` | How aggressively to adjust downwards | `number` | 2
`scaleMax` | Scale up by this value at most | `number` | 10
`scaleMin` | Scale down by this value at most | `number` | 0.01
`metric` | Function that measures your metric of choice | `function` | see below

**target** is the 'ideal' value of the `metric`. By default, the target is 20% event loop utilization.

> Node and the OS need breathing room. Event-loop utilization of 80% can be, for me at least, 100% cpu usage, and introduce significant event-loop lag.

**scaleUp** scales how much the `adjuster` will attempt to increase the metric. At 1, the `adjustment` is not altered. At 0.5, each adjustment should move the metric half-way to the target. This allows the metric to smoothly approach the target over time. By default, this is 0.5, to slowly scale up the workload to the target ELU.

**scaleDown** is like scaleUp, but for scaling down. By default, this is 2, to quickly back-off the workload when the ELU target is exceeded.

**scaleMax** is the largest multiplier the `adjuster` can return. By default, this is 10, such that the largest increase in workload loop-over-loop is tenfold.

**scaleMin** is like scaleMax, but for decreasing the workload. The `adjuster` will not attempt to scale the metric by anything smaller than this.

**metric** should return a number. This will be compared to the target. This function is only called if the `adjuster` function is not given an argument. By default, this is a function that measures Node's event loop utilization.

### `adjuster([metric])` &rarr; `adjustment`

The `adjuster` function (returned from `createAdjuster`) takes a single optional argument, `metric`. If `metric` is not defined, the function will call the `metric` function passed to `createAdjuster`. By default, this is Node's event-loop utilization.

`adjuster()` returns an `adjustment` object.

### `adjustment`

The `adjustment` object has 3 properties and 3 convenience functions.

```js
{
	scale: 1, // Scale your thing by this much
	rawScale: 1, // Scale without the scale Up, Down, Min/Max applied
	measurement: 1, // The value of the metric when this object was created
	toJSON, // returns this as json (without these helper functions)
	valueOf, // allows you to treat this object as a number. Returns `scale`
	toString // allows you to treat this object as a string. Behaves like json.
}
```

## License

MIT
