/**
 * @own_instance
 * Represents a seeded random number generator.
 * All instance methods of this class are available statically, so `Random.int(3, 5)` is valid and uses statically stored state of the class itself.
 * The random number generation functions of this class are organized into two categories: stable and unstable.
 * Stable functions will produce the same value when called with the same arguments.
 * Unstable functions don't take any seeding parameters and change their return value on each call.
 * ```js
 * let total = 0;
 * let count = 0;
 * 
 * intervals.continuous(() => {
 * 	total += Random.int(1, 10); // generate a random value each frame
 * 	count++;
 * 	const mean = total / count; // compute the mean of the random values
 * 	renderer.draw(new Color("black")).text(Font.Arial20, mean, 10, 10);
 * });
 * ```
 * @prop Number seed | The current seed for the unstable random functions. e.g. `.random()`, `.angle()`, `.range()`, etc.
 * @prop Number sampleSeed | The seed for the stable random functions. e.g. `.perlin3D()`, `.voronoi()`, etc.
 * @prop Function distribution | The distribution of the numbers generated. This is one of the provided static distribution properties of the Random class (`.uniform`, `.normal`, etc.)
 * @static_prop Function uniform | A uniform distribution
 * @static_prop Function normal | A normal distribution
 */
class Random {
	/**
	 * Creates a new random number generator. If either of the seeds are unspecified, they will be initialized to random numbers.
	 * @signature
	 * @param Number seed | The initial seed for the unstable random functions.
	 * @param Number sampleSeed | The seed used for the stable random functions.
	 * @param Function distribution? | The initial distribution for the numbers generated. Default is `Random.uniform`
	 * @signature
	 * @param Number seed | The initial seed for unstable functions
	 * @param Function distribution? | The initial distribution. Default is `Random.uniform`
	 * @signature
	 * @param Function distribution | The initial distribution
	 */
    constructor(seed, sampleSeed, distribution = Random.uniform) {
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
    seedRand(seed) {
        return this.distribution(seed);
    }
	/**
	 * Returns a random number on [0, 1). Unstable.
	 * @return Number
	 */
    random() {
        return this.seedRand(this.seed++);
    }
	/**
	 * Returns a random value in an unbounded normal distribution. Unstable
	 * @param Number mu? | The mean return value. Default is 0
	 * @param Number sd? | The standard deviation of possible return values. Default is 1
	 * @return Number
	 */
    normalZ(mu = 0, sd = 1) {
        const area = this.random();
        return mu + sd * Math.log(1 / area - 1) / -1.8;
    }
	/**
	 * Returns a random integer on [min, max]. Unstable.
	 * @param Number min | The lower bound
	 * @param Number max | The upper bound
	 * @return Number
	 */
    int(min, max) {
        return Math.floor(this.random() * (max - min + 1) + min);
    }
	/**
	 * Returns a random boolean value. Unstable.
	 * @param Number chance? | The probability that the return value is true. Default is 0.5
	 * @return Boolean
	 */
    bool(chance = 0.5) {
        return this.random() < chance;
    }
	/**
	 * Returns a random sign, with a 50/50 chance to be -1 or 1. Unstable.
	 * @return Number
	 */
    sign() {
        return (this.random() < 0.5) ? -1 : 1;
    }
	/**
	 * Returns a random floating-point value on [min, max). Unstable.
	 * @param Number min | The lower bound
	 * @param Number max | The upper bound
	 * @return Number
	 */
    range(min = 0, max = 1) {
        return this.random() * (max - min) + min;
    }
    lerp(a, b) {
        return Interpolation.lerp(a, b, this.random());
    }
	/**
	 * Returns a random valid index for a given array. Unstable.
	 * @param Any[] arr | The array to choose an index for
	 * @return Number
	 */
	index(arr) {
		return this.int(0, arr.length - 1);
	}
	/**
	 * Returns a random angle in radians on [0, 2π). Unstable.
	 * @return Number
	 */
    angle() {
        return this.random() * 2 * Math.PI;
    }
	/**
	 * Returns a random single character utf-16 string. Unstable.
	 * @return String
	 */
    char() {
        return String.fromCharCode(Math.round(this.random() * 0xFFFF));
    }
	/**
	 * Returns a random opaque color. Unstable.
	 * @param Color result? | The destination for the color. Default is a new color.
	 * @return Color
	 */
    color(result = Color.zero) {
        result.red = this.random() * 255;
        result.green = this.random() * 255;
        result.blue = this.random() * 255;
        result.alpha = 1;
        return result;
    }
	/**
	 * Returns a random point within a given convex shape.
	 * This method only works with `.distribution` being `Random.uniform`.
	 * Unstable.
	 * @param Shape region | The region within which to generate the point
	 * @return Vector2
	 */
	inShape(region) {
		if (region instanceof Circle)
			return Vector2.fromAngle(Random.angle())
				.mul(region.radius * Math.sqrt(Random.range(0, 1)))
				.add(region.middle);
		if (region instanceof Rect)
			return new Vector2(
				Random.range(region.x, region.x + region.width),
				Random.range(region.y, region.y + region.height)
			);
		if (region instanceof Polygon) {
			const triangles = Geometry.triangulate(region);
			const areas = triangles
				.map(([a, b, c]) => Math.abs(
					(b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x)
				));
			const [a, b, c] = Random.choice(triangles, areas);
			let px = Random.range(0, 1);
			let py = Random.range(0, 1);
			if (py > 1 - px) {
				px = 1 - px;
				py = 1 - py;
			}
			return	c.Vminus(a).Nmul(px)
					.Vadd(b.Vminus(a).Nmul(py))
					.Vadd(a);
		}
		return region.middle;
	}
	/**
	 * Randomly orders an array in-place. Unstable.
	 * @param Any[] arr | The array to reorder
	 * @return Any[]
	 */
	shuffle(arr) {
		for (let i = 0; i < arr.length; i++) {
			const inx = this.index(arr);
			const t = arr[i];
			arr[i] = arr[inx];
			arr[inx] = t;
		}

		return arr;
	}
	/**
	 * Chooses an (optionally weighted) random element from an array. Unstable.
	 * @signature
	 * @param Iterable values | The values to choose from
	 * @signature
	 * @param Iterable values | The values to choose from
	 * @param Number[] percentages | The weight of each value. These can be multiplied by any constant factor
	 * @return Any
	 */
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
	/**
	 * Randomly selects a sample (with replacement) from a given collection of values. Unstable.
	 * @param Iterable values | The values to sample from 
	 * @param Number quantity | The size of the sample
	 * @return Any[]
	 */
    sample(arr, quantity) {
        if (!Array.isArray(arr)) arr = Array.from(arr);
        if (quantity >= arr.length) return [...arr];
        const result = [];
        while (result.length < quantity)
            result.push(arr[Math.floor(this.random() * arr.length)]);
        return result;
    }
	/**
	 * Randomly selects a sample (without replacement) from a given collection of values. Unstable.
	 * @param Iterable values | The values to sample from 
	 * @param Number quantity | The size of the sample
	 * @return Any[]
	 */
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
	/**
	 * Returns the sum of a specified number of octaves of a specified type of noise.
	 * @param Number octaves | The number of octaves 
	 * @param Function algorithm | The stable algorithm of which octaves are being generated
	 * @param Number[] ...noiseArgs | The arguments to the noise function
	 * @return Number
	 */
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
	/**
	 * Samples 1D Perlin noise.
	 * @param Number x | The sample location
	 * @param Number f? | The frequency of the Perlin noise. Default is 1
	 * @param Number seed? | The seed for the noise. Default is sampleSeed
	 * @return Number
	 */
    perlin(x, f = 1, seed = this.sampleSeed) {
        x *= f;
        x += seed;

        let xt = x % 1;
        if (xt < 0) xt++;
		xt = Interpolation.smooth(xt);
		x = ~~x;
        
		return this.seedRand(x) * (1 - xt) + this.seedRand(x + 1) * xt;
    }
	/**
	 * Samples 2D Perlin noise.
	 * @param Number x | The sample location's x coordinate
	 * @param Number y | The sample location's y coordinate
	 * @param Number f? | The frequency of the Perlin noise. Default is 1
	 * @param Number seed? | The seed for the noise. Default is sampleSeed
	 * @return Number
	 */
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
	/**
	 * Samples 3D Perlin noise.
	 * @param Number x | The sample location's x coordinate
	 * @param Number y | The sample location's y coordinate
	 * @param Number z | The sample location's z coordinate
	 * @param Number f? | The frequency of the Perlin noise. Default is 1
	 * @param Number seed? | The seed for the noise. Default is sampleSeed
	 * @return Number
	 */
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
	/**
	 * Samples 1D Voronoi noise.
	 * @param Number x | The sample location
	 * @param Number f? | The frequency of the Voronoi noise. Default is 1
	 * @param Number seed? | The seed for the noise. Default is sampleSeed
	 * @return Number
	 */
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
	/**
	 * Samples 2D Voronoi noise.
	 * @param Number x | The sample location's x coordinate
	 * @param Number y | The sample location's y coordinate
	 * @param Number f? | The frequency of the Voronoi noise. Default is 1
	 * @param Number seed? | The seed for the noise. Default is sampleSeed
	 * @return Number
	 */
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
	/**
	 * Samples 3D Voronoi noise.
	 * @param Number x | The sample location's x coordinate
	 * @param Number y | The sample location's y coordinate
	 * @param Number z | The sample location's z coordinate
	 * @param Number f? | The frequency of the Voronoi noise. Default is 1
	 * @param Number seed? | The seed for the noise. Default is sampleSeed
	 * @return Number
	 */
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
	/**
	 * Chooses a new random seed and sampleSeed for the random number generator. 
	 */
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
    const names = Object.getOwnPropertyNames(Random.prototype);
    for (let i = 0; i < names.length; i++) {
        const name = names[i];
        if (name === "constructor") continue;
        const fn = Random.prototype[name];
        Random[name] = fn.bind(Random);
    }

	Random.reSeed();
	Random.distribution = Random.uniform;
};