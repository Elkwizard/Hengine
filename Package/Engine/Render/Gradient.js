/**
 * @name class ValueStop
 * @interface
 * This is an interface for values passed to methods of Gradient.
 * Represents a point along a gradient with a specific value.
 * @prop Number start | The parameter value at which this stop's value reaches full intensity
 * @prop Operable value | The gradient value at this stop
 */

/**
 * Represents a parameterized gradient between a series of different values.
 * These values can be of any Operable type.
 * ```js
 * // color of daylight at different times
 * const daylightGradient = new Gradient([
 * 	{ start: 0, value: new Color("black") },
 * 	{ start: 7, value: new Color("purple") },
 * 	{ start: 8, value: new Color("orange") },
 * 	{ start: 12, value: new Color("yellow") },
 * 	{ start: 20, value: new Color("red") },
 * 	{ start: 24, value: new Color("black") }
 * ]);
 * 
 * intervals.continuous(() => {
 * 	const hourMS = 1000 * 60 * 60;
 * 	const hour = (Date.now() % (hourMS * 24)) / hourMS;
 * 	const color = daylightGradient.sample(hour);
 * 	renderer.fill(color);
 * });
 * ```
 */
class Gradient {
	/**
	 * Creates a new Gradient.
	 * @param ValueStop[] valueStops | A list of specified values at specified points.
	 */
	constructor(valueStops) {
		this.valueStops = valueStops;
		this.processRanges();
	}
	processRanges() {
		this.valueStops.sort((a, b) => b.start - a.start);
	}
	/**
	 * Adds an additional value stop.
	 * @param ValueStop valueStop | The value stop to add.
	 */
	addValueStop(valueStop) {
		this.valueStops.push(valueStop);
		this.processRanges();
	}
	/**
	 * Samples the gradient at a specific value of the parameter
	 * @param Number t | The parameter value to sample at
	 * @return Operable
	 */
	sample(v) {
		let valueStop = null;
		for (let stop of this.valueStops) {
			if (v >= stop.start) {
				valueStop = stop;
				break;
			}
		}
		if (valueStop) {
			let a = valueStop;
			let inx = this.valueStops.indexOf(valueStop);
			let b = this.valueStops[inx - 1];
			if (b !== undefined) return a.value.constructor.lerp(a.value, b.value, (v - a.start) / (b.start - a.start));
			else return a.value;
		}
		return new Color(0, 0, 0, 0);
	}
}