class Interpolation {
    static slerp(a, b, t) {
        return Interpolation.lerp(a, b, Interpolation.smooth(t));
    }
    static squadlerp(a, b, c, d, tx, ty) {
        return Interpolation.quadLerp(a, b, c, d, Interpolation.smooth(tx), Interpolation.smooth(ty));
    }
    static lerp(a, b, t) {
        return a.times(1 - t).plus(b.times(t));
    }
    static quadLerp(a, b, c, d, tx, ty) {
        const l = Interpolation.lerp(a, c, ty);
        const r = Interpolation.lerp(b, d, ty);
        let per = Interpolation.lerp(l, r, tx);
        return per;
    }
    static cubeLerp(a, b, c, d, a2, b2, c2, d2, tx, ty, tz) {
        let top = Interpolation.quadLerp(a, b, c, d, tx, ty);
        let bottom = Interpolation.quadLerp(a2, b2, c2, d2, tx, ty);
        return Interpolation.lerp(top, bottom, tz);
    }
    static smoothMin(a, b, k = 1) {
        k *= -1;
        let t = Number.clamp((b - a) / k + 0.5, 0, 1);
        let t2 = t * (1 - t) * 0.5 * k;
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