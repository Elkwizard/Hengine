class Random {
    static random() {
        return Random.seedRand(Random.seed++);
    }
    static range(min = 0, max = 1) {
        return Random.random() * (max - min) + min;
    }
    static angle() {
        return Random.random() * 2 * Math.PI;
    }
    static seedRand(seed) {
        seed += 1e5;
        let a = (seed * 6.12849) % 8.7890975
        let b = (a * 256783945.4758903) % 238462.567890;
        let r = (a * b) % 1;
        return Math.abs(r);
    }
    static octave(alg, freq, oc, ...sample) {
        let n = 0;
        let scl = 0;
        for (let i = 1; i < 1 + oc; i++) {
            scl += 1 / i;
            n += Random[alg](...sample, freq * i) / i;
        }
        return n / scl;
    }
    static choice(arr) {
        return arr[Math.floor(Random.random() * arr.length)];
    }
    static noiseTCorrect(t) {
        return Interpolation.smoothT(t);
    }
    static noiseTCorrect(t) {
        const f = (x) => (x - 2) * (x + 2) * x;
        return f(-2.31 * t + 1.155) / 6.158 + 0.5;
    }
    static perlin(x, f = 1, seed = Random.seed) {
        x += seed;
        x *= f;
        const s_0 = n => Random.seedRand(Math.floor(n));
        const n = x => Interpolation.lerp(s_0(x), s_0(x + 1), Random.noiseTCorrect(x % 1));
        return n(x);
    }
    static perlin2D(x, y, f = 1, seed = Random.seed) {
        x += seed;
        y += seed;
        x *= f;
        y *= f;
        const s_p = (x, y) => Random.seedRand(Math.floor(x) + Math.floor(y) * 2000);
        const n = (x, y) => Interpolation.quadLerp(s_p(x, y), s_p(x + 1, y), s_p(x, y + 1), s_p(x + 1, y + 1), Random.noiseTCorrect(x % 1), Random.noiseTCorrect(y % 1));
        return n(x, y);
    }
    static perlin3D(x, y, z, f = 1, seed = Random.seed) {
        x += seed;
        y += seed;
        z += seed;
        x *= f;
        y *= f;
        z *= f;
        const s_p = (x, y, z) => Random.seedRand(Random.seedRand(Math.floor(x)) + Random.seedRand(Math.floor(y) * 2000) + Random.seedRand(Math.floor(z) * 2000000));
        const n = (x, y, z) => Interpolation.cubeLerp(
            s_p(x, y, z), s_p(x + 1, y, z), s_p(x, y + 1, z), s_p(x + 1, y + 1, z),
            s_p(x, y, z + 1), s_p(x + 1, y, z + 1), s_p(x, y + 1, z + 1), s_p(x + 1, y + 1, z + 1),
            Random.noiseTCorrect(x % 1), Random.noiseTCorrect(y % 1), Random.noiseTCorrect(z % 1));
        return n(x, y, z);
    }
    static getVoronoiCell(x) {
        return { x: Math.floor(x) + Random.seedRand(Math.floor(x)) };
    }
    static voronoi(x, f = 1, seed = Random.seed) {
        x += seed;
        x *= f;
        let bestDist = Infinity;
        for (let i = -1; i < 2; i++) {
            let cell = Random.getVoronoiCell(x + i);
            let dist = (cell.x - x) ** 2;
            if (dist < bestDist) bestDist = dist;
        }
        return bestDist;
    }
    static getVoronoiCell2D(x, y) {
        return {
            x: Math.floor(x) + Random.seedRand(Math.floor(x) + Math.floor(y) * 1000),
            y: Math.floor(y) + Random.seedRand(Math.floor(y) + Math.floor(x) * 10000)
        };
    }
    static voronoi2D(x, y, f = 1, seed = Random.seed) {
        x += seed;
        y += seed;
        x *= f;
        y *= f;
        let bestDist = Infinity;
        for (let i = -1; i < 2; i++) for (let j = -1; j < 2; j++) {
            let cell = Random.getVoronoiCell2D(x + i, y + j);
            let dist = (cell.x - x) ** 2 + (cell.y - y) ** 2;
            if (dist < bestDist) bestDist = dist;
        }
        return bestDist;
    }
    static getVoronoiCell3D(x, y, z) {
        return {
            x: Math.floor(x) + Random.seedRand(Math.floor(x) + Math.floor(y) * 1000 + Math.floor(z) * 10000),
            y: Math.floor(y) + Random.seedRand(Math.floor(y) + Math.floor(x) * 1000000 + Math.floor(z) * 900),
            z: Math.floor(z) + Random.seedRand(Math.floor(y) * 10000 + Math.floor(x) * 100 + Math.floor(z) * 90000)
        };
    }
    static voronoi3D(x, y, z, f = 1, seed = Random.seed) {
        x += seed;
        y += seed;
        z += seed;
        x *= f;
        y *= f;
        z *= f;
        let bestDist = Infinity;
        for (let i = -1; i < 2; i++) for (let j = -1; j < 2; j++) for (let k = -1; k < 2; k++) {
            let cell = Random.getVoronoiCell3D(x + i, y + j, z + k);
            let dist = (cell.x - x) ** 2 + (cell.y - y) ** 2 + (cell.z - z) ** 2;
            if (dist < bestDist) bestDist = dist;
        }
        return bestDist;
    }
}
Random.seed = Math.random() * 1000;