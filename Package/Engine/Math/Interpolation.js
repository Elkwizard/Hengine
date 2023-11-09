/**
 * Provides a collection of interpolation algorithms that operate on operables and numbers.
 * All methods of this class are static and do not mutate their arguments.
 * ```js
 * Interpolation.lerp(new Color("red"), new Color("blue"), 0.5); // dark purple
 * Interpolation.lerp(new Vector2(0, 0), new Vector2(10, 0), 0.3); // (3, 0)
 * Interpolation.lerp(0, 10, 0.8) // 8
 * ```
 */
class Interpolation {
	/**
	 * Linearly interpolates between two values.
	 * @param Number a | The initial value
	 * @param Number b | The final value
	 * @param Number t | The progress proportion from the initial value to the final value, on the interval [0, 1]
	 * @return Number 
	 */
    static lerp(a, b, t) {
        return a.times(1 - t).plus(b.times(t));
    }
	/**
	 * Smoothly interpolates between two values. (Uses the Interpolation.smooth easing function)
	 * @param Number a | The initial value
	 * @param Number b | The final value
	 * @param Number t | The progress proportion from the initial value to the final value, on the interval [0, 1]
	 * @return Number 
	 */
    static smoothLerp(a, b, t) {
        return Interpolation.lerp(a, b, Interpolation.smooth(t));
    }
	/**
	 * Linearly interpolates between four values in a square formation.
	 * @param Number a | The value in the upper-left corner
	 * @param Number b | The value in the upper-right corner
	 * @param Number c | The value in the lower-left corner
	 * @param Number d | The value in the lower-right corner
	 * @param Number tx | The horizontal progress proportion
	 * @param Number ty | The vertical progress proportion
	 * @return Number
	 */
    static quadLerp(a, b, c, d, tx, ty) {
        const left = Interpolation.lerp(a, c, ty);
        const right = Interpolation.lerp(b, d, ty);
        return Interpolation.lerp(left, right, tx);
    }
	/**
	 * Smoothly interpolates between four values in a square formation. (Uses the Interpolation.smooth easing function)
	 * @param Number a | The value in the upper-left corner
	 * @param Number b | The value in the upper-right corner
	 * @param Number c | The value in the lower-left corner
	 * @param Number d | The value in the lower-right corner
	 * @param Number tx | The horizontal progress proportion
	 * @param Number ty | The vertical progress proportion
	 * @return Number
	 */
    static smoothQuadLerp(a, b, c, d, tx, ty) {
        return Interpolation.quadLerp(a, b, c, d, Interpolation.smooth(tx), Interpolation.smooth(ty));
    }
	/**
	 * Linearly interpolates between eight values in a cube formation.
	 * @param Number a | The value in the front-upper-left corner
	 * @param Number b | The value in the front-upper-right corner
	 * @param Number c | The value in the front-lower-left corner
	 * @param Number d | The value in the front-lower-right corner
	 * @param Number a2 | The value in the back-upper-left corner
	 * @param Number b2 | The value in the back-upper-right corner
	 * @param Number c2 | The value in the back-lower-left corner
	 * @param Number d2 | The value in the back-lower-right corner
	 * @param Number tx | The horizontal progress proportion
	 * @param Number ty | The vertical progress proportion
	 * @param Number tz | The depth progress proportion
	 * @return Number
	 */
    static cubeLerp(a, b, c, d, a2, b2, c2, d2, tx, ty, tz) {
        const top = Interpolation.quadLerp(a, b, c, d, tx, ty);
        const bottom = Interpolation.quadLerp(a2, b2, c2, d2, tx, ty);
        return Interpolation.lerp(top, bottom, tz);
    }
	/**
	 * Smoothly interpolates between eight values in a cube formation. (Uses the Interpolation.smooth easing function)
	 * @param Number a | The value in the front-upper-left corner
	 * @param Number b | The value in the front-upper-right corner
	 * @param Number c | The value in the front-lower-left corner
	 * @param Number d | The value in the front-lower-right corner
	 * @param Number a2 | The value in the back-upper-left corner
	 * @param Number b2 | The value in the back-upper-right corner
	 * @param Number c2 | The value in the back-lower-left corner
	 * @param Number d2 | The value in the back-lower-right corner
	 * @param Number tx | The horizontal progress proportion
	 * @param Number ty | The vertical progress proportion
	 * @param Number tz | The depth progress proportion
	 * @return Number
	 */
    static smoothCubeLerp(a, b, c, d, a2, b2, c2, d2, tx, ty, tz) {
        return Interpolation.cubeLerp(a, b, c, d, a2, b2, c2, d2, Interpolation.smooth(tx), Interpolation.smooth(ty), Interpolation.smooth(tz));
    }
	/**
	 * Computes the smooth minimum between two numbers.
	 * @param Number a | The first argument to the minimum
	 * @param Number b | The second argument to the minimum
	 * @param Number k? | The smoothing parameter. Default is 1 
	 * @return Number 
	 */
    static smoothMin(a, b, k = 1) {
        k *= -1;
        const t = Number.clamp((b - a) / k + 0.5, 0, 1);
        const t2 = 0.5 * k * t * (1 - t);
        return (1 - t) * a + t * b + t2;
    }
	/**
	 * Computes the smooth maximum between two numbers.
	 * @param Number a | The first argument to the maximum
	 * @param Number b | The second argument to the maximum
	 * @param Number k? | The smoothing parameter. Default is 1 
	 * @return Number 
	 */
    static smoothMax(a, b, k = 1) {
        return Interpolation.smoothMin(a, b, -k);
    }
	/**
	 * A linear easing function. Can be used to adjust animation timing.
	 * @param Number t | The input parameter value, on [0, 1]
	 * @return Number
	 */
    static linear(t) {
        return t;
    }
	/**
	 * A smoothed easing function. Can be used to adjust animation timing.
	 * @param Number t | The input parameter value, on [0, 1]
	 * @return Number
	 */
    static smooth(t) {
        return -2 * t ** 3 + 3 * t ** 2;
    }
	/**
	 * A increasing-speed easing function. Can be used to adjust animation timing.
	 * @param Number t | The input parameter value, on [0, 1]
	 * @return Number
	 */
    static increasing(t) {
        return t ** 2;
    }
	/**
	 * A decreasing-speed easing function. Can be used to adjust animation timing.
	 * @param Number t | The input parameter value, on [0, 1]
	 * @return Number
	 */
    static decreasing(t) {
        return 1 - (1 - t) ** 2;
    }
}

/**
 * Represents a Operable- or Number-valued variable that smoothly moves between values.
 * If a transition between states is interrupted by setting a new target, the new transition will begin immediately and will begin from the current position.
 * ```js
 * const point = new Animatable(middle, 100, Interpolation.smooth);
 * 
 * intervals.continuous(() => {
 * 	if (mouse.justPressed("Left"))
 * 		point.target = mouse.screen;
 * 	renderer.draw(new Color("black")).circle(point.value, 10);
 * });
 * ```
 * @prop Operable/Number target | The current target value of the animatable
 * @prop Number duration | The length of each transition, in frames
 * @prop Number => Number easing | The easing function for the transitions
 * @prop Boolean copyTarget | Whether or not target values should be copied. If this value is false, changing the value passed into target will change the trajectory of the value, even if the value is not passed in again
 */
class Animatable {
	/**
	 * Creates a new Animatable.
	 * @param Operable/Number initial | The initial value
	 * @param Number duration | The length of each transition, in frames
	 * @param Number => Number easing | The easing function to use. Default is `Interpolation.linear`
	 * @param Boolean copyTarget | Whether or not target values should be copied. Default is true
	 */
	constructor(initial, duration, easing = Interpolation.linear, copyTarget = true) {
		this.duration = duration;
		this.easing = easing;
		this.copyTarget = copyTarget;
		this.value = initial;
	}

	set target(target) {
		if (
			this._target !== undefined &&
			(this.copyTarget ? target.equals(this._target) : target === this._target)
		) return;
		this.start = this._target === undefined ? target.get() : this.current;
		this._target = this.copyTarget ? target.get() : target;
		this.timer = 0;
	}

	get target() {
		return this._target;
	}

	/**
	 * Sets the value immediately. This will not involve a transition.
	 * @param Operable/Number value | The new value
	 */
	set value(value) {
		this.target = this.copyTarget ? value.get() : value;
		this.start = value.get();
	}

	/**
	 * Returns the current value of the animatable and advances one frame in the transition.
	 * @return Operable/Number
	 */
	get value() {
		this.timer++;
		return this.current;
	}

	/**
	 * Returns the current value of the animatable and doesn't advance the transition
	 * @return Operable/Number
	 */
	get current() {
		const t = Number.clamp(this.timer / this.duration, 0, 1);
		return Interpolation.lerp(this.start, this.target, this.easing(t));
	}
}