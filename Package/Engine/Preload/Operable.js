/**
 * @name class MathObject
 * @type interface MathObject implements Copyable
 * @implements Copyable
 * Represents a mathematical object, on which operations (+, -, *, /, %, **) can be performed.
 * The operations are provided as two sets of methods, one which mutates the caller, and one which creates a new object to hold the result.
 * ```js
 * new Complex(3, 6).over(3) // 1 + 2i
 * new Vector3(1, 2, 3).plus(3) // (4, 5, 6)
 * Quaternion.fromRotation(Vector3.up, Math.PI) // 0 + 0i + -1j + 0k
 * ```
 * @abstract
 */
class MathObject {
	/**
	 * Returns the reciprocal of the caller.
	 * @return MathObject
	 */
	get reciprocal() {
		return this.get().flip();
	}
	/**
	 * Returns the inverse of the caller.
	 * @return MathObject
	 */
	get inverse() {
		return this.get().invert();
	}
	/**
	 * @group plus/minus/times/over/modBy/pow
	 * Performs an operation between the caller and another object, and returns it.
	 * @param MathObject other | The right-hand side of the operation. This must be either the same type as the caller or a number
	 * @param MathObject result? | The destination to store the resulting object in. If not specified, a new object will be created
	 * @return MathObject
	 */
	minus(other, dst = this.constructor.zero) {
		return this.plus(other.inverse, dst);
	}
	over(other, dst = this.constructor.zero) {
		return this.times(other.reciprocal, dst);
	}
	/**
	 * @group add/sub/mul/div/mod/exp
	 * Peforms an operation between the caller and another object, stores the result in the caller, and returns it.
	 * @param MathObject other | The right-hand side of the operation. This must be either the same type as the caller or a number
	 * @return MathObject
	 */
    add(other) {
		return this.plus(other, this);
    }
    sub(other) {
		return this.minus(other, this);
    }
    mul(other) {
		return this.times(other, this);
    }
    div(other) {
		return this.over(other, this);
    }
	mod(other) {
		return this.modBy(other, this);
	}
	exp(other) {
		return this.pow(other, this);
	}
	/**
	 * Replaces the caller with its reciprocal and returns it.
	 * @return MathObject
	 */
	flip() {
		return this.exp(-1);
	}
	/**
	 * Negates the caller and returns it.
	 * @return MathObject
	 */
	invert() {
		return this.mul(-1);
	}
	/**
	 * Replaces the content of the caller with that of a given MathObject of the same type, then returns the caller.
	 * @param MathObject source | The object from which to copy the data
	 * @return MathObject
	 */
	set(other) {
		return other.get(this);
	}
	/**
	 * @name equals
	 * Returns whether the caller is equal, within a small tolerance, to another given object of the same type.
	 * @param MathObject other | The object to compare to
	 * @return Boolean
	 */
	/**
	 * @name toFixed
	 * Returns a string representation of the object with a specified level of precision for included numbers.
	 * @param Number digits | The number of digits of precision
	 * @return String
	 */
	/**
	 * @name toMaxed
	 * Returns a string representation of the object with a specified maximum level of precision for included numbers.
	 * @param Number max | The maximum number of digits of precision. The displayed amount of digits may be less, since trailing zeroes are discarded
	 * @return String
	 */
	/**
	 * @name static get zero
	 * Returns a value such that for any MathObject `a`, `a.plus(a.constructor.zero).equals(a)` is true.
	 * @return MathObject
	 */
	/**
	 * Computes the sum of a collection of MathObjects of the same type.
	 * @param MathObject[] values | The values to sum
	 * @param MathObject result? | The destination to store the resulting object in. If not specified, a new object will be created
	 * @return MathObject
	 */
    static sum(values, result = this.zero) {
		result = result.mul(0);
		for (let i = 0; i < values.length; i++)
			result = result.add(values[i]);
        return result;
    }
	/**
	 * Computes the average of a collection of MathObjects of the same type.
	 * @param MathObject[] values | The values to average.
	 * @param MathObject result? | The destination to store the resulting object in. If not specified, a new object will be created
	 * @return MathObject
	 */
	static avg(values, result) {
		return this.sum(values, result).div(values.length);
	}
	static lerp(a, b, t, result = this.zero) {
		return a.times(1 - t, result).add(b.times(t));
	}
    static defineReference(obj, key, value = this.zero) {
        delete obj[key];
        Object.defineProperty(obj, key, {
            set(a) {
				value.set(a);
            },
            get() {
                return value;
            }
        });
		return value;
    }
}
MathObject.EPSILON = 0.000001;
MathObject.add = (a, b) => a + b;
MathObject.sub = (a, b) => a - b;
MathObject.mul = (a, b) => a * b;
MathObject.div = (a, b) => a / b;
MathObject.pow = (a, b) => a ** b;

/**
 * @implements MathObject, Serializable
 * Represents a composite mathematical object which element-wise operations can be performed on.
 * @abstract
 * @static_prop String[] modValues | The names of the elements in the operable. The order of this array also determines the order of the elements (e.g. `["x", "y"]` for Vector2)
 */
class Operable extends MathObject {
	/**
	 * Produces a list of all the elements of the operable.
	 * @return Number[]
	 */
    get values() {
        return this.constructor.modValues.map(field => this[field]);
    }
	/**
	 * Sets all elements of the operable, either by copying from another operable, or by using a list of numeric values.
	 * Returns the caller.
	 * @signature
	 * @param Operable other | The operable to copy values from
	 * @param Number fill? | A value to fill missing elements with. Default is 0
	 * @signature
	 * @param Number[] ...elements | The new element values
	 * @return Operable
	 */
    set(...values) {
		const first = values[0];
        if (first instanceof this.constructor)
            return first.get(this);
       
		const { modValues } = this.constructor;
		if (first instanceof Operable) {
			const fill = values[1] ?? 0;
			for (let i = 0; i < modValues.length; i++) {
				const field = modValues[i];
				this[field] = first[field] ?? fill;
			}
		} else {
			for (let i = 0; i < modValues.length; i++) {
				const field = modValues[i];
				this[field] = values[i];
			}
		}

        return this;
    }
    get(result = this.constructor.zero) {
        const { modValues } = this.constructor;
        for (let i = 0; i < modValues.length; i++) {
            const field = modValues[i];
            result[field] = this[field];
        }
        return result;
    }
	/**
	 * Retrieves a single element value from the operable.
	 * @param Number index | The element index
	 * @return Number
	 */
    at(index) {
        return this[this.constructor.modValues[index]];
    }
    op(v, fn, dst = this.constructor.zero) {
        const { modValues } = this.constructor;
        if (typeof v === "number") {
            for (let i = 0; i < modValues.length; i++) {
                const field = modValues[i];
                dst[field] = fn(this[field], v);
            }
        } else {
            for (let i = 0; i < modValues.length; i++) {
                const field = modValues[i];
                dst[field] = fn(this[field], v[field] ?? 0);
            }
        }
        return dst;
    }
    plus(v, result) {
		return this.op(v, Operable.addFunc, result);
    }
    minus(v, result) {
		return this.op(v, Operable.subFunc, result);
    }
    times(v, result) {
		return this.op(v, Operable.mulFunc, result);
    }
    over(v, result) {
		return this.op(v, Operable.divFunc, result);
    }
	modBy(v, result) {
		return this.op(v, Operable.modFunc, result);
	}
	pow(v, result) {
		return this.op(v, Math.pow, result);
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
	 * Computes the sum of all the elements of the operable.
	 * @return Number
	 */
    total() {
        let sum = 0;
        for (let i = 0; i < this.constructor.modValues.length; i++) sum += Math.abs(this.at(i));
        return sum;
    }
	/**
	 * Checks equality between the operable and another operable of the same type.
	 * @param Operable other | The operable to compare to
	 * @return Boolean
	 */
    equals(v) {
		if (this === v) return true;
		if (v === undefined || v.constructor !== this.constructor) return false;

        const { modValues, EPSILON = MathObject.EPSILON } = this.constructor;
        for (let i = 0; i < modValues.length; i++) {
            const field = modValues[i];
            if (Math.abs(this[field] - v[field]) >= EPSILON) return false;
        }
        return true;
    }
    toByteBuffer(buffer = new ByteBuffer()) {
        const { modValues } = this.constructor;
        for (let i = 0; i < modValues.length; i++)
            buffer.write.float64(this[modValues[i]]);
        return buffer;
    }
    static fromByteBuffer(buffer) {
        const result = this.zero;
        const { modValues } = this;
        for (let i = 0; i < modValues.length; i++)
            result[modValues[i]] = buffer.read.float64();
        return result;
    }
    static get zero() {
        return new (this.zeroConstructor ??= this.bind(
            null, ...new Uint8Array(this.modValues.length)
        ));
    }
	/**
	 * Remaps an operable from one range to another range.
	 * @param Operable value | The operable to be remapped
	 * @param Operable initialMin | The minimum of the range the value is in
	 * @param Operable initialMax | The maximum of the range the value is in
	 * @param Operable finalMin | The minimum of the desired range
	 * @param Operable finalMax | The maximum of the desired range
	 * @return Operable
	 */
    static remap(n, a, b, a2, b2) {
        return n.minus(a).div(b.minus(a)).mul(b2.minus(a2)).add(a2);
    }
	/**
	 * Returns an operable clamped element-wise between two bounds.
	 * Equivalent to `Operable.max(min, operable.min(max, value))`.
	 * @param Operable value | The value to clamp
	 * @param Operable min | The lower bound for the result
	 * @param Operable max | The upper bound for the result
	 * @return Operable
	 */
    static clamp(n, a, b) {
        return this.max(a, this.min(b, n));
    }
	/**
	 * Produces an operable with all elements equal to a single value.
	 * @param Number value | The value that will be used for all elements
	 * @return Operable
	 */
    static filled(value) {
        return new this(...this.modValues.map(() => value));
    }
	/**
	 * Finds and returns the element-wise minimum of a series of values.
	 * @param Operable[]/Number[] ...values | The values to compare
	 * @return Operable
	 */
    static min(...values) {
		if (!values.length) return this.filled(Infinity);

        let acc = values[0].get();
        for (let i = 1; i < values.length; i++) 
            acc = acc.op(values[i], Math.min, acc);
        return acc;
    }
	/**
	 * Finds and returns the element-wise maximum of a series of values.
	 * @param Operable[]/Number[] ...values | The values to compare
	 * @return Operable
	 */
    static max(...values) {
		if (!values.length) return this.filled(-Infinity);

        let acc = values[0].get();
        for (let i = 1; i < values.length; i++) 
            acc = acc.op(values[i], Math.max, acc);
        return acc;
    }
	static bound(values) {
		if (!values.length) return {
			min: this.filled(Infinity),
			max: this.filled(-Infinity)
		};

		const { modValues } = this;

		const min = values[0].get();
		const max = min.get();

		for (let i = 1; i < values.length; i++) {
			const value = values[i];
			for (let j = 0; j < modValues.length; j++) {
				const key = modValues[j];
				const comp = value[key];
				if (comp < min[key]) min[key] = comp;
				else if (comp > max[key]) max[key] = comp;
			}
		}

		return { min, max };
	}
	/**
	 * @group static round, static floor, static ceil, static trunc, static abs, static sqrt, static log, static log2, static log10, static sin, static cos, static tan, static sinh, static cosh, static tanh, static asin, static acos, static atan, static asinh, static acosh, static atanh, static sign
	 * Performs a built-in unary Math operation element-wise on an operable.
	 * @param Operable value | The operable to operate on
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
            value: arg => arg.map(fn),
            enumerable: false
        });
    }
})();

Operable.modValues = [];
Operable.addFunc = (a, b) => a + b;
Operable.subFunc = (a, b) => a - b;
Operable.mulFunc = (a, b) => a * b;
Operable.divFunc = (a, b) => a / b;
Operable.modFunc = (a, b) => a % b;