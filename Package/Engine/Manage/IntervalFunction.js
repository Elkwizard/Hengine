class IntervalFunction {
	constructor(fn, len, type) {
		this.fn = fn;
		this.type = type;
		this.interval = len;
		this.timer = 0;
		this.done = false;
	}
	increment() {
		this.respond();
		this.timer++;
		if (this.timer > this.interval) {
			this.done = true;
		}
	}
	respond() {

	}
}
IntervalFunction.BEFORE_UPDATE = Symbol("BEFORE_UPDATE");
IntervalFunction.UPDATE = Symbol("UPDATE");
IntervalFunction.AFTER_UPDATE = Symbol("AFTER_UPDATE");

class DelayedFunction extends IntervalFunction {
	constructor(fn, wait, type) {
		super(fn, wait, type);
	}
	respond() {
		if (this.timer > this.interval) {
			this.fn();
		}
	}
}
class TransitionFunction extends IntervalFunction {
	constructor(fn, wait, type) {
		super(fn, wait, type);
	}
	respond() {
		this.fn(this.timer / this.interval);
	}
}
class ContinuousFunction extends IntervalFunction {
	constructor(fn, type) {
		super(fn, Infinity, type);
	}
	respond() {
		this.fn(this.timer);
	}
}
class IntervalFunctionManager {
	constructor() {
		this.functions = [];
	}
	beforeUpdate() {
		this.updateIntervalCalls(IntervalFunction.BEFORE_UPDATE);
	}
	update() {
		this.updateIntervalCalls(IntervalFunction.UPDATE);
	}
	afterUpdate() {
		this.updateIntervalCalls(IntervalFunction.AFTER_UPDATE);
	}
	continuous(fn, type = IntervalFunction.AFTER_UPDATE) {
		this.functions.push(new ContinuousFunction(fn, type));
	}
	transition(fn, frames, type = IntervalFunction.BEFORE_UPDATE) {
		this.functions.push(new TransitionFunction(fn, frames, type));
	}
	animate(object, property, value, time, curve = t => t, type = IntervalFunction.BEFORE_UPDATE) {
		let start = object[property].get();
		this.transition(t => {
			object[property] = Interpolation.lerp(start, value, curve(t));
		}, time, type);
	}
	delay(fn, frames, type = IntervalFunction.BEFORE_UPDATE) {
		this.functions.push(new DelayedFunction(fn, frames, type));
	}
	updateIntervalCalls(type) {
		let remaining = [];
		for (let i = 0; i < this.functions.length; i++) {
			const int_fn = this.functions[i];
			if (int_fn.type === type) {
				int_fn.increment();
			}
			if (!int_fn.done) remaining.push(int_fn);
		}
		this.functions = remaining;
	}
}