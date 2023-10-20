class Interpolation {
    static lerp(a, b, t) {
        return a.times(1 - t).plus(b.times(t));
    }
    static smoothLerp(a, b, t) {
        return Interpolation.lerp(a, b, Interpolation.smooth(t));
    }
    static quadLerp(a, b, c, d, tx, ty) {
        const left = Interpolation.lerp(a, c, ty);
        const right = Interpolation.lerp(b, d, ty);
        return Interpolation.lerp(left, right, tx);
    }
    static smoothQuadLerp(a, b, c, d, tx, ty) {
        return Interpolation.quadLerp(a, b, c, d, Interpolation.smooth(tx), Interpolation.smooth(ty));
    }
    static cubeLerp(a, b, c, d, a2, b2, c2, d2, tx, ty, tz) {
        const top = Interpolation.quadLerp(a, b, c, d, tx, ty);
        const bottom = Interpolation.quadLerp(a2, b2, c2, d2, tx, ty);
        return Interpolation.lerp(top, bottom, tz);
    }
    static smoothCubeLerp(a, b, c, d, a2, b2, c2, d2, tx, ty, tz) {
        return Interpolation.cubeLerp(a, b, c, d, a2, b2, c2, d2, Interpolation.smooth(tx), Interpolation.smooth(ty), Interpolation.smooth(tz));
    }
    static smoothMin(a, b, k = 1) {
        k *= -1;
        const t = Number.clamp((b - a) / k + 0.5, 0, 1);
        const t2 = 0.5 * k * t * (1 - t);
        return (1 - t) * a + t * b + t2;
    }
    static smoothMax(a, b, k = 1) {
        return Interpolation.smoothMin(a, b, -k);
    }
    static linear(t) {
        return t;
    }
    static smooth(t) {
        return -2 * t ** 3 + 3 * t ** 2;
    }
    static increasing(t) {
        return t ** 2;
    }
    static decreasing(t) {
        return 1 - (1 - t) ** 2;
    }
}

class Animatable {
	constructor(initial, duration, easing = Interpolation.linear, copyTarget = true) {
		this.duration = duration;
		this.value = initial;
		this.easing = easing;
		this.copyTarget = copyTarget;
	}

	set target(target) {
		if (
			this._target !== undefined &&
			(copyTarget ? target.equals(this._target) : target === this._target)
		) return;
		this.timer = 0;
		this._target = copyTarget ? target.get() : target;
		this.start = this.current;
	}

	get target() {
		return this._target;
	}

	set value(value) {
		this.target = value.get();
		this.start = value.get();
	}

	get value() {
		this.timer++;
		return this.current;
	}

	get current() {
		const t = Number.clamp(this.timer / this.duration, 0, 1);
		return Interpolation.lerp(this.start, this.target, this.easing(t));
	}
}