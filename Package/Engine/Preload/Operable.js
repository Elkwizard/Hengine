class Operable {
    constructor() {

    }
    get(result = this.constructor.empty) {
        for (let x of this.constructor.modValues) result[x] = this[x];
        return result;
    }
    op(v, fn) {
        if (typeof v === "number") {
            for (let x of this.constructor.modValues) this[x] = fn(this[x], v);
        } else {
            for (let x of this.constructor.modValues) this[x] = fn(this[x], v[x]);
        }
        return this;
    }
    gop(v, fn) {
        return this.get().op(v, fn);
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
        return this.minus(v).total() < this.constructor.EPSILON * this.constructor.modValues.length;
    }
    static get empty() {
        return new this(...this.modValues.map(name => 0));
    }
    static defineReference(obj, key, value) {
        let mod = value.constructor.modValues;
        let len = mod.length;
        delete obj[key];
        Object.defineProperty(obj, key, {
            set(a) {
                for (let i = 0; i < len; i++) value[mod[i]] = a[mod[i]];
            },
            get() {
                return value;
            }
        });
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
        return a.gop(b, Math.min);
    }
    static max(a, b) {
        return a.gop(b, Math.max);
    }
    static lerp(a, b, t) {
        return a.gop(b, (A, B) => A * (1 - t) + B * t);
    }
}
Operable.EPSILON = 0.000001;
Operable.modValues = [];