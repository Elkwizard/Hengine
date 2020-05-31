class Operable {
    constructor() {
        
    }
    get() {
        let args = [];
        for (let x of this.constructor.modValues) args.push(this[x]);
        return new this.constructor(...args);
    }
    super_op(v, fn) {
        if (typeof v === "number") {
            for (let x of this.constructor.modValues) this[x] = fn(this[x], v);
        } else {
            for (let x of this.constructor.modValues) this[x] = fn(this[x], v[x]);
        }
        return this;
    }
    op(v, fn) {
        if (typeof v === "number") {
            for (let x of this.constructor.modValues) this[x] = fn(this[x], v);
        } else {
            for (let x of this.constructor.modValues) this[x] = fn(this[x], v[x]);
        }
        return this;
    }
	add(...vl) {
		for (let v of vl) this.op(v, (a, b) => a + b);
		return this;
	}
	sub(...vl) {
		for (let v of vl) this.op(v, (a, b) => a - b);
		return this;
	}
	mul(...vl) {
		for (let v of vl) this.op(v, (a, b) => a * b);
		return this;
	}
	div(...vl) {
		for (let v of vl) this.op(v, (a, b) => a / b);
		return this;
	}
    plus(...v) {
        return this.get().add(...v);
    }
    minus(...v) {
        return this.get().sub(...v);
    }
    times(...v) {
        return this.get().mul(...v);
    }
    over(...v) {
        return this.get().div(...v);
    }
    map(fn) {
        let args = [];
        for (let x of this.constructor.modValues) args.push(fn(this[x], x));
        return new this.constructor(...args);
    }
    total() {
        let sum = 0;
        for (let x of this.constructor.modValues) sum += Math.abs(this[x]);
        return sum;
    }
    equals(v) {
        return this.minus(v).total() < 0.00001;
    }
    static lerp(a, b, t) {
        let ops = a.constructor.modValues;
        let args = [];
        for (let x of ops) args.push(Interpolation.lerp(a[x], b[x], t));
        return new a.constructor(...args);
    }
}
Operable.modValues = [];