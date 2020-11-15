class Operable {
    constructor() {
        
    }
    get() {
        return new this.constructor(...this.constructor.modValues.map(v => this[v]));
    }
    op(v, fn) {
        if (typeof v === "number") {
            for (let x of this.constructor.modValues) this[x] = fn(this[x], v);
        } else {
            for (let x of this.constructor.modValues) this[x] = fn(this[x], v[x]);
        }
        return this;
    }
	add(v) {
		return this.op(v, (a, b) => a + b);
	}
	sub(v) {
		return this.op(v, (a, b) => a - b);
	}
	mul(v) {
		return this.op(v, (a, b) => a * b);
	}
	div(v) {
		return this.op(v, (a, b) => a / b);
	}
    plus(v) {
        return this.get().add(v);
    }
    minus(v) {
        return this.get().sub(v);
    }
    times(v) {
        return this.get().mul(v);
    }
    over(v) {
        return this.get().div(v);
    }
    map(fn) {
        let args = [];
        for (let x of this.constructor.modValues) args.push(fn(this[x], x));
        return new this.constructor(...args);
    }
    abs() {
        return this.map(Math.abs);
    }
    total() {
        let sum = 0;
        for (let x of this.constructor.modValues) sum += Math.abs(this[x]);
        return sum;
    }
    equals(v) {
        return this.minus(v).total() < 0.00001;
    }
    static get empty() {
        return new this(...this.modValues.map(name => 0));
    }
    static defineReference(obj, key, value) {
        let mod = value.constructor.modValues;
        let len = mod.length;
        delete obj[key];
        let store = value;
        Object.defineProperty(obj, key, {
            set(a) {
                for (let i = 0; i < len; i++) store[mod[i]] = a[mod[i]];
            },
            get() {
                return value;
            }
        })

    }
	static sum(v) {
		let construct = v.length ? v[0].constructor : this;
        let acc = construct.empty;
        for (let i = 0; i < v.length; i++) acc.add(v[i]);
        return acc;
	}
	static avg(v) {
		return this.sum(v).over(v.length);
    }
    static remap(n, a, b, a2, b2) {
        return new this(...this.modValues.map(x => (n[x] - a[x]) / (b[x] - a[x]) * (b2[x] - a2[x]) + a2[x]));
    }
    static clamp(n, a, b) {
        return new this(...this.modValues.map(x => Math.max(a[x], Math.min(b[x], n[x]))));
    }
    static filled(value) {
        return new this(...this.modValues.map(() => value));
    }
    static min(a, b) {
        if (a instanceof Number) a = this.filled(a);
        if (b instanceof Number) b = this.filled(b);
        return new this(...this.modValues.map(x => Math.min(a[x], b[x])));
    }
    static max(a, b) {
        if (a instanceof Number) a = this.filled(a);
        if (b instanceof Number) b = this.filled(b);
        return new this(...this.modValues.map(x => Math.max(a[x], b[x])));
    }
    static lerp(a, b, t) {
        let ops = a.constructor.modValues;
        let args = [];
        for (let x of ops) args.push(Interpolation.lerp(a[x], b[x], t));
        return new a.constructor(...args);
    }
}
Operable.modValues = [];