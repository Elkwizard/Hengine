class Random {
    constructor() {
        this.constructor.apply(this, arguments); // I have no clue why this does anything at all
    }
    seedRand(seed) {
        return this.distribution(seed);
    }
    random() {
        return this.seedRand(this.seed++);
    }
    normalZ(mu = 0, sd = 1) {
        const area = this.random();
        return mu + sd * Math.log(1 / area - 1) / -1.8;
    }
    int(min, max) {
        return Math.floor(this.random() * (max - min + 1) + min);
    }
    bool(chance = 0.5) {
        return this.random() < chance;
    }
    sign() {
        return (this.random() < 0.5) ? -1 : 1;
    }
    range(min = 0, max = 1) {
        return this.random() * (max - min) + min;
    }
    lerp(a, b) {
        return Interpolation.lerp(a, b, this.random());
    }
    angle() {
        return this.random() * 2 * Math.PI;
    }
    char() {
        return String.fromCharCode(Math.round(this.random() * 0xFFFF));
    }
    color(result = Color.empty) {
        result.red = this.random() * 255;
        result.green = this.random() * 255;
        result.blue = this.random() * 255;
        result.alpha = 1;
        return result;
    }
    choice(arr, percentages = null) {
        if (!Array.isArray(arr)) arr = Array.from(arr);
        if (percentages === null) {
            return arr[Math.floor(this.random() * arr.length)];
        } else {
            let sum = 0;
			for (let i = 0; i < percentages.length; i++)
				sum += percentages[i];
			const isum = 1 / sum;
			
			let min = 0;
            let random = this.random();
            for (let i = 0; i < percentages.length; i++) {
                const percent = percentages[i] * isum;
                if (random >= min && random < min + percent) return arr[i];
                min += percent;
            }
            return arr.last;
        }
    }
    sample(arr, quantity) {
        if (!Array.isArray(arr)) arr = Array.from(arr);
        if (quantity >= arr.length) return [...arr];
        const result = [];
        while (result.length < quantity)
            result.push(arr[Math.floor(this.random() * arr.length)]);
        return result;
    }
    sampleWithoutReplacement(arr, quantity) {
        if (!Array.isArray(arr)) arr = Array.from(arr);
        const sampled = new Set();
        const result = [];
        while (result.length < quantity) {
            const index = Math.floor(this.random() * arr.length);
            if (sampled.has(index)) continue;
            result.push(arr[index]);
            sampled.add(index);
        }
        return result;
    }
    octave(oc, alg, ...sampleAndFreq) {
        let seed, freq = 1;

		if (sampleAndFreq.length === alg.length + 2)
			seed = sampleAndFreq.pop();
		if (sampleAndFreq.length === alg.length + 1)
			freq = sampleAndFreq.pop();

		let n = 0, scl = 0;

        for (let i = 1; i < 1 + oc; i++) {
            scl += 1 / i;
            n += alg(...sampleAndFreq, freq * i, seed) / i;
        }
        return n / scl;
    }
    perlin(x, f = 1, seed = this.sampleSeed) {
        x *= f;
        x += seed;

        let xt = x % 1;
        if (xt < 0) xt++;
		xt = Interpolation.smooth(xt);
		x = ~~x;
        
		return this.seedRand(x) * (1 - xt) + this.seedRand(x + 1) * xt;
    }
    perlin2D(x, y, f = 1, seed = this.sampleSeed) {
        y *= f;
        y += seed;

        let yt = y % 1;
        if (yt < 0) yt++;
		yt = Interpolation.smooth(yt);
		y = ~~y;

		const top = this.perlin(x + y * 2000, f, seed);
		const bottom = this.perlin(x + (y + 1) * 2000, f, seed);

		return top * (1 - yt) + bottom * yt;
    }
    perlin3D(x, y, z, f = 1, seed = this.sampleSeed) {
		z *= f;
        z += seed;

        let zt = z % 1;
        if (zt < 0) zt++;
		zt = Interpolation.smooth(zt);
		z = ~~z;

		const front = this.perlin2D(x, y + z * 200000, f, seed);
		const back = this.perlin2D(x, y + (z + 1) * 200000, f, seed);

		return front * (1 - zt) + back * zt;
    }
    getVoronoiCell(x) {
        return { x: Math.floor(x) + this.seedRand(Math.floor(x)) };
    }
    voronoi(x, f = 1, seed = this.sampleSeed) {
        x *= f;
        x += seed;
        let bestDist = Infinity;
        for (let i = -1; i < 2; i++) {
            let cell = this.getVoronoiCell(x + i);
            let dist = (cell.x - x) ** 2;
            if (dist < bestDist) bestDist = dist;
        }
        return bestDist;
    }
    getVoronoiCell2D(x, y) {
        return {
            x: Math.floor(x) + this.seedRand(Math.floor(x) + Math.floor(y) * 1000),
            y: Math.floor(y) + this.seedRand(Math.floor(y) + Math.floor(x) * 10000)
        };
    }
    voronoi2D(x, y, f = 1, seed = this.sampleSeed) {
        x *= f;
        y *= f;
        x += seed;
        y += seed;
        let bestDist = Infinity;
        for (let i = -1; i < 2; i++) for (let j = -1; j < 2; j++) {
            let cell = this.getVoronoiCell2D(x + i, y + j);
            let dist = (cell.x - x) ** 2 + (cell.y - y) ** 2;
            if (dist < bestDist) bestDist = dist;
        }
        return bestDist;
    }
    getVoronoiCell3D(x, y, z) {
        return {
            x: Math.floor(x) + this.seedRand(Math.floor(x) + Math.floor(y) * 1000 + Math.floor(z) * 10000),
            y: Math.floor(y) + this.seedRand(Math.floor(y) + Math.floor(x) * 1000000 + Math.floor(z) * 900),
            z: Math.floor(z) + this.seedRand(Math.floor(y) * 10000 + Math.floor(x) * 100 + Math.floor(z) * 90000)
        };
    }
    voronoi3D(x, y, z, f = 1, seed = this.sampleSeed) {
        x *= f;
        y *= f;
        z *= f;
        x += seed;
        y += seed;
        z += seed;
        let bestDist = Infinity;
        for (let i = -1; i < 2; i++) for (let j = -1; j < 2; j++) for (let k = -1; k < 2; k++) {
            let cell = this.getVoronoiCell3D(x + i, y + j, z + k);
            let dist = (cell.x - x) ** 2 + (cell.y - y) ** 2 + (cell.z - z) ** 2;
            if (dist < bestDist) bestDist = dist;
        }
        return bestDist;
    }
    reSeed() {
        this.seed = Math.random() * 1000;
        this.sampleSeed = Math.random() * 1000;
    }
    static uniform(seed) {
        seed += 1e5;
        let a = (seed * 638835776.12849) % 8.7890975;
        let b = (a * 256783945.4758903) % 2.567890;
        let r = Math.abs(a * b * 382749.294873597) % 1;
        return r;
    }
}

{ // normal distribution
    
    const mu = 0.5;
    const sd = 0.2;
    const normalcdf = x => 1 / (1 + Math.exp(-1.8 * (x - mu) / sd));
    const invnorm = area => mu + sd * Math.log(1 / area - 1) / -1.8;
    const area0 = normalcdf(0);
    const area1 = normalcdf(1);
    
    Random.normal = function (seed) {
		const area = Random.uniform(seed) * (area1 - area0) + area0;
		return invnorm(area);
    }
};

{
    function construct(seed, sampleSeed, distribution = Random.uniform) {
        if (typeof seed === "function") {
            distribution = seed;
            seed = undefined;
        } else if (typeof sampleSeed === "function") {
            distribution = sampleSeed;
            sampleSeed = undefined;
        }
        this.reSeed();
        if (seed !== undefined) this.seed = seed;
        if (sampleSeed !== undefined) this.sampleSeed = sampleSeed;
        this.distribution = distribution;
    }
    
    const names = Object.getOwnPropertyNames(Random.prototype);
    for (let i = 0; i < names.length; i++) {
        const name = names[i];
        if (name === "constructor") continue;
        const fn = Random.prototype[name];
        Random[name] = fn.bind(Random);
    }

    // setup
    construct.call(Random);
    Random.prototype.constructor = construct;
};