class Gradient {
	constructor(valueStops) {
		this.valueStops = valueStops;
		this.processRanges();
	}
	processRanges() {
		this.valueStops.sort((a, b) => b.start - a.start);
	}
	addValueStop(valueStop) {
		this.valueStops.push(valueStop);
		this.processRanges();
	}
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