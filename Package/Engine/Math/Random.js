class Random {
    static seedRand(seed) {
        return Random.distribution(seed);
    }
    static random() {
        return Random.seedRand(Random.seed++);
    }
    static bool(chance = 0.5) {
        return Random.random() < chance;
    }
    static range(min = 0, max = 1) {
        return Random.random() * (max - min) + min;
    }
    static angle() {
        return Random.random() * 2 * Math.PI;
    }
    static char() {
        return String.fromCharCode(Math.round(Random.random() * 0xFFFF));
    }
    static color(result = Color.empty) {
        result.red = Random.random() * 255;
        result.green = Random.random() * 255;
        result.blue = Random.random() * 255;
        result.alpha = 1;
        return result;
    }
    static choice(arr, percentages = null) {
        if (!Array.isArray(arr)) arr = Array.from(arr);
        if (percentages === null) {
            return arr[Math.floor(Random.random() * arr.length)];
        } else {
            let min = 0;
            let random = Random.random();
            for (let i = 0; i < percentages.length; i++) {
                const percent = percentages[i];
                if (random >= min && random < min + percent) return arr[i];
                min += percent;
            }
            return arr.last;
        }
    }
    static octave(oc, alg, ...sampleAndFreq) {
        const freq = sampleAndFreq.pop();
        let sample = sampleAndFreq;

        let n = 0;
        let scl = 0;
        let len = alg.length + 1;
        let seed = Random.sampleSeed;
        if (len === sample.length) {
            seed = sample[sample.length - 1];
            sample.length = alg.length;
        }
        for (let i = 1; i < 1 + oc; i++) {
            scl += 1 / i;
            n += alg(...sample, freq * i, seed) / i;
        }
        return n / scl;
    }
    static perlin(x, f = 1, seed = Random.sampleSeed) {
        x *= f;
        x += seed;
        const s_0 = n => Random.seedRand(Math.floor(n));
        let xt = x % 1;
        if (xt < 0) xt++;
        return Interpolation.smoothLerp(
            s_0(x), s_0(x + 1), 
            xt
        );
    }
    static perlin2D(x, y, f = 1, seed = Random.sampleSeed) {
        x *= f;
        y *= f;
        x += seed;
        y += seed;
        const s_p = (x, y) => Random.seedRand(Math.floor(x) + Math.floor(y) * 2000);
        let xt = x % 1;
        let yt = y % 1;
        if (xt < 0) xt++;
        if (yt < 0) yt++;
        return Interpolation.smoothQuadLerp(
            s_p(x, y), s_p(x + 1, y), s_p(x, y + 1), s_p(x + 1, y + 1), 
            xt, yt
        );
    }
    static perlin3D(x, y, z, f = 1, seed = Random.sampleSeed) {
        x *= f;
        y *= f;
        z *= f;
        x += seed;
        y += seed;
        z += seed;
        const s_p = (x, y, z) => Random.seedRand(Random.seedRand(Math.floor(x)) + Random.seedRand(Math.floor(y) * 2000) + Random.seedRand(Math.floor(z) * 2000000));
        let xt = x % 1;
        let yt = y % 1;
        let zt = z % 1;
        if (xt < 0) xt++;
        if (yt < 0) yt++;
        if (zt < 0) zt++;
        return Interpolation.smoothCubeLerp(
            s_p(x, y, z), s_p(x + 1, y, z), s_p(x, y + 1, z), s_p(x + 1, y + 1, z),
            s_p(x, y, z + 1), s_p(x + 1, y, z + 1), s_p(x, y + 1, z + 1), s_p(x + 1, y + 1, z + 1),
            xt, yt, zt
        );
    }
    static getVoronoiCell(x) {
        return { x: Math.floor(x) + Random.seedRand(Math.floor(x)) };
    }
    static voronoi(x, f = 1, seed = Random.sampleSeed) {
        x *= f;
        x += seed;
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
    static voronoi2D(x, y, f = 1, seed = Random.sampleSeed) {
        x *= f;
        y *= f;
        x += seed;
        y += seed;
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
    static voronoi3D(x, y, z, f = 1, seed = Random.sampleSeed) {
        x *= f;
        y *= f;
        z *= f;
        x += seed;
        y += seed;
        z += seed;
        let bestDist = Infinity;
        for (let i = -1; i < 2; i++) for (let j = -1; j < 2; j++) for (let k = -1; k < 2; k++) {
            let cell = Random.getVoronoiCell3D(x + i, y + j, z + k);
            let dist = (cell.x - x) ** 2 + (cell.y - y) ** 2 + (cell.z - z) ** 2;
            if (dist < bestDist) bestDist = dist;
        }
        return bestDist;
    }
    static reSeed() {
        Random.seed = Math.random() * 1000;
        Random.sampleSeed = Math.random() * 1000;
    }
}
Random.reSeed();
Random.uniform = function (seed) {
    seed += 1e5;
    let a = (seed * 638835776.12849) % 8.7890975;
    let b = (a * 256783945.4758903) % 2.567890;
    let r = Math.abs(a * b * 382749.294873597) % 1;
    return r;
};
Random.normal = function (seed) {
    return (Random.uniform(seed) + Random.uniform(seed + 1000) + Random.uniform(seed + 2000)) / 3;
};
Random.distribution = Random.uniform;