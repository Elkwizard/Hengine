class Operable {
    constructor(...values) {
        this.modValues = values;
    }
    get() {
        let args = [];
        for (let x of this.modValues) args.push(this[x]);
        return new this.constructor(...args);
    }
    super_op(v, fn) {
        if (typeof v === "number") {
            for (let x of this.modValues) this[x] = fn(this[x], v);
        } else {
            for (let x of this.modValues) this[x] = fn(this[x], v[x]);
        }
        return this;
    }
    op(v, fn) {
        if (typeof v === "number") {
            for (let x of this.modValues) this[x] = fn(this[x], v);
        } else {
            for (let x of this.modValues) this[x] = fn(this[x], v[x]);
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
    mod(v) {
        return this.get().op(v, (a, b) => a % b);
    }
    map(fn) {
        let args = [];
        for (let x of this.modValues) args.push(fn(this[x], x));
        return new this.constructor(...args);
    }
    total() {
        let sum = 0;
        for (let x of this.modValues) sum += this[x];
        return sum;
    }
    equals(v) {
        return this.minus(v).total() < 0.00001;
    }
}