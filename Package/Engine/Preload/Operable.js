class Operable {
    constructor() {

    }
    get values() {
        return this.constructor.modValues.map(field => this[field]);
    }
    set(...values) {
        if (values[0] instanceof this.constructor)
            return values[0].get(this);
        const { modValues } = this.constructor;
        for (let i = 0; i < modValues.length; i++) {
            const field = modValues[i];
            this[field] = values[i];
        }
        return this;
    }
    get(result = this.constructor.empty) {
        const { modValues } = this.constructor;
        for (let i = 0; i < modValues.length; i++) {
            const field = modValues[i];
            result[field] = this[field];
        }
        return result;
    }
    at(index) {
        return this[this.constructor.modValues[index]];
    }
    op(v, fn) {
        const { modValues } = this.constructor;
        if (typeof v === "number") {
            for (let i = 0; i < modValues.length; i++) {
                const field = modValues[i];
                this[field] = fn(this[field], v);
            }
        } else {
            for (let i = 0; i < modValues.length; i++) {
                const field = modValues[i];
                this[field] = fn(this[field], v[field] ?? 0);
            }
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
    plus(v, result) {
        return this.get(result).add(v);
    }
    minus(v, result) {
        return this.get(result).sub(v);
    }
    times(v, result) {
        return this.get(result).mul(v);
    }
    over(v, result) {
        return this.get(result).div(v);
    }
    map(fn) {
        const result = this.get();
        const { modValues } = this.constructor;
        for (let i = 0; i < modValues.length; i++) {
            const field = modValues[i];
            result[field] = fn(result[field], field);
        }
        return result;
    }
    total() {
        let sum = 0;
        for (let i = 0; i < this.constructor.modValues.length; i++) sum += Math.abs(this.at(i));
        return sum;
    }
    equals(v) {
		if (this === v) return true;
		if (v === undefined || v.constructor !== this.constructor) return false;

        const { modValues, EPSILON } = this.constructor;
        for (let i = 0; i < modValues.length; i++) {
            const field = modValues[i];
            if (Math.abs(this[field] - v[field]) >= EPSILON) return false;
        }
        return true;
    }
    toByteBuffer() {
        const buffer = new ByteBuffer();
        const { modValues } = this.constructor;
        for (let i = 0; i < modValues.length; i++)
            buffer.write.float64(this[modValues[i]]);
        return buffer;
    }
    static fromByteBuffer(buffer) {
        buffer.pointer = 0;
        const result = this.empty;
        const { modValues } = this;
        for (let i = 0; i < modValues.length; i++)
            result[modValues[i]] = buffer.read.float64();
        return result;
    }
    static get empty() {
        // return new this(...[...this.modValues].fill(0));
        return new (this.emptyConstructor ??= this.bind(
            null, ...new Uint8Array(this.modValues.length)
        ));
    }
    static defineReference(obj, key, value) {
        const mod = value.constructor.modValues;
        const len = mod.length;
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
        const acc = this.empty;
        for (let i = 0; i < v.length; i++) acc.add(v[i]);
        return acc;
    }
    static avg(v) {
        return this.sum(v).over(v.length);
    }
    static remap(n, a, b, a2, b2) {
        return n.minus(a).div(b.minus(a)).mul(b2.minus(a2)).add(a2);
    }
    static clamp(n, a, b) {
        return this.max(a, this.min(b, n));
    }
    static filled(value) {
        return new this(...this.modValues.map(() => value));
    }
    static min(...values) {
        const acc = this.filled(Infinity);
        for (let i = 0; i < values.length; i++) 
            acc.op(values[i], Math.min);
        return acc;
    }
    static max(...values) {
        const acc = this.filled(-Infinity);
        for (let i = 0; i < values.length; i++) {
            acc.op(values[i], Math.max);
        }
        return acc;
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
Operable.emptyConstructor = null;
Operable.addFunc = (a, b) => a + b;
Operable.subFunc = (a, b) => a - b;
Operable.mulFunc = (a, b) => a * b;
Operable.divFunc = (a, b) => a / b;