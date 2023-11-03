/**
 * Represents a composite mathematical object which element-wise operations can be performed on.
 * Many mathematical operations (plus, minus, times, over) can be performed on Operables of any type, allowing for convenient polymorphism.
 * Operable is an abstract superclass, and should not be constructed.
 * All immutable methods, including static methods, are available on Numbers.
 * This means that Number can largely be considered a subclass of Operable and can be used for Operable-typed arguments.
 * @static_prop String[] modValues | The names of the elements in the Operable. The order of this array also determines the order of the elements (e.g. `["x", "y"]` for Vector)
 */
class Operable {
    constructor() {

    }
	/**
	 * Produces a list of all the elements of the Operable.
	 * @return Number[]
	 */
    get values() {
        return this.constructor.modValues.map(field => this[field]);
    }
	/**
	 * Sets all elements of the Operable, either by copying from another Operable of the same type, or by using a list of numeric values.
	 * Returns the caller.
	 * @signature
	 * @param Operable other | The Operable to copy values from
	 * @signature
	 * @param Number[] ...elements | The new element values
	 * @return Operable
	 */
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
	/**
	 * Copies the Operable into an optional destination (if not provided, a new Operable will be created).
	 * Returns the copy.
	 * @signature
	 * @signature
	 * @param Operable destination | The result for the copy operation.
	 * @return Operable
	 */
    get(result = this.constructor.empty) {
        const { modValues } = this.constructor;
        for (let i = 0; i < modValues.length; i++) {
            const field = modValues[i];
            result[field] = this[field];
        }
        return result;
    }
	/**
	 * Retrieves a single element value from the Operable.
	 * @param Number index | The element index
	 * @return Number
	 */
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
	/**
	 * @group add, sub, mul, div
	 * Performs an in-place element-wise arithmetic operation between the caller and another Operable or Number.
	 * Returns the caller.
	 * @param Operable/Number operable | The right hand operand of the operation
	 * @return Operable
	 */
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
	/**
	 * @group plus, minus, times, over
	 * Performs an immutable element-wise arithmetic operation between the caller and another Operable or Number.
	 * Returns the result of the operation, leaving the operands unchanged.
	 * @param Operable/Number operable | The right hand operand of the operation
	 * @return Operable
	 */
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
	/**
	 * Computes the sum of all the elements of the Operable.
	 * @return Number
	 */
    total() {
        let sum = 0;
        for (let i = 0; i < this.constructor.modValues.length; i++) sum += Math.abs(this.at(i));
        return sum;
    }
	/**
	 * Checks equality between the Operable and another Operable of the same type.
	 * @param Operable other | The Operable to compare to
	 * @return Boolean
	 */
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
	/**
	 * Writes the Operable to a ByteBuffer, which can either be created or passed as an optional destination.
	 * @signature
	 * @signature
	 * @param ByteBuffer destination | The destination for the write operation
	 */
    toByteBuffer(buffer = new ByteBuffer()) {
        const { modValues } = this.constructor;
        for (let i = 0; i < modValues.length; i++)
            buffer.write.float64(this[modValues[i]]);
        return buffer;
    }
	/**
	 * Reads an Operable from the ByteBuffer, and returns it.
	 * @param ByteBuffer buffer | The source buffer to read from
	 * @return Operable
	 */
    static fromByteBuffer(buffer) {
        const result = this.empty;
        const { modValues } = this;
        for (let i = 0; i < modValues.length; i++)
            result[modValues[i]] = buffer.read.float64();
        return result;
    }
	/**
	 * Produces an Operable with 0 for all element values.
	 * @return Operable
	 */
    static get empty() {
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
	/**
	 * Computes the element-wise sum of a list of Operables.
	 * @param Operable/Number[] operables | The values to sum 
	 * @return Operable
	 */
    static sum(v) {
        const acc = this.empty;
        for (let i = 0; i < v.length; i++) acc.add(v[i]);
        return acc;
    }
	/**
	 * Computes the element-wise average of a list of Operables.
	 * @param Operable/Number[] operables | The values to average 
	 * @return Operable
	 */
    static avg(v) {
        return this.sum(v).over(v.length);
    }
	/**
	 * Remaps an Operable from one range to another range.
	 * @param Operable/Number value | The Operable to be remapped
	 * @param Operable/Number initialMin | The minimum of the range the value is in
	 * @param Operable/Number initialMax | The maximum of the range the value is in
	 * @param Operable/Number finalMin | The minimum of the desired range
	 * @param Operable/Number finalMax | The maximum of the desired range
	 * @return Operable
	 */
    static remap(n, a, b, a2, b2) {
        return n.minus(a).div(b.minus(a)).mul(b2.minus(a2)).add(a2);
    }
	/**
	 * Returns an Operable clamped element-wise between two bounds.
	 * Equivalent to `Operable.max(min, Operable.min(max, value))`.
	 * @param Operable/Number value | The value to clamp
	 * @param Operable/Number min | The lower bound for the result
	 * @param Operable/Number max | The upper bound for the result
	 * @return Operable
	 */
    static clamp(n, a, b) {
        return this.max(a, this.min(b, n));
    }
	/**
	 * Produces an Operable with all elements equal to a single value.
	 * @param Number value | The value that will be used for all elements
	 * @return Operable
	 */
    static filled(value) {
        return new this(...this.modValues.map(() => value));
    }
	/**
	 * Finds and returns the element-wise minimum of a series of values.
	 * @param Operable/Number[] ...values | The values to compare
	 * @return Operable
	 */
    static min(...values) {
        const acc = this.filled(Infinity);
        for (let i = 0; i < values.length; i++) 
            acc.op(values[i], Math.min);
        return acc;
    }
	/**
	 * Finds and returns the element-wise maximum of a series of values.
	 * @param Operable/Number[] ...values | The values to compare
	 * @return Operable
	 */
    static max(...values) {
        const acc = this.filled(-Infinity);
        for (let i = 0; i < values.length; i++) {
            acc.op(values[i], Math.max);
        }
        return acc;
    }
	/**
	 * Performs an element-wise exponentiation.
	 * @param Operable base | The base of the exponentiation
	 * @param Operable/Number power | The power of the exponentiation
	 * @return Operable
	 */
    static pow(a, power) {
        return a.gob(power, Math.pow);
    }
    static lerp(a, b, t) {
        return a.gop(b, (A, B) => A * (1 - t) + B * t);
    }
	/**
	 * @group static round, static floor, static ceil, static trunc, static abs, static sqrt, static log, static log2, static log10, static sin, static cos, static tan, static sinh, static cosh, static tanh, static asin, static acos, static atan, static asinh, static acosh, static atanh, static sign
	 * Performs a built-in unary Math operation element-wise on an Operable.
	 * @param Operable value | The Operable to operate on
	 * @return Operable
	 */
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