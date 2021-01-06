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
        return this.op(v, Operable.addFunc);
    }
    sub(v) {
        return this.op(v, Operable.subFunc);
    }
    mul(v) {
        return this.op(v, Operable.mulFunc);
    }
    div(v) {
        return this.op(v, Operable.divFunc);
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
        const result = this.get();
        for (let x of this.constructor.modValues) result[x] = fn(result[x]);
        return result;
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
        return new this(...this.modValues.fill(value));
    }
    static min(a, b) {
        return a.gop(b, Math.min);
    }
    static max(a, b) {
        return a.gop(b, Math.max);
    }
    static pow(a, power) {
        return a.gob(power, Math.pow);    
    }
    static lerp(a, b, t) {
        return a.gop(b, (A, B) => A * (1 - t) + B * t);
    }
}

(function () {
    // Math. functions

    const mathFunctions = [
        "round", "floor", "ceil", "trunc",
        "abs",
        "sqrt",
        "log", "log2", "log10",
        "sin", "cos", "tan", "sinh", "cosh", "tanh",
        "asin", "acos", "atan", "asinh", "acosh", "atanh",
        "sign"
    ];

    for (let i = 0; i < mathFunctions.length; i++) {
        const fnName = mathFunctions[i];
        const fn = Math[fnName].bind(Math);

        Object.defineProperty(Operable, fnName, {
            value: function (arg) {
                return arg.map(fn);
            },
            enumerable: false
        });
    }

})();

Operable.EPSILON = 0.000001;
Operable.modValues = [];
Operable.addFunc = (a, b) => a + b;
Operable.subFunc = (a, b) => a - b;
Operable.mulFunc = (a, b) => a * b;
Operable.divFunc = (a, b) => a / b;