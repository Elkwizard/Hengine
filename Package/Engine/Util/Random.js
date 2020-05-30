class Random {
    static randSeed(seed) {
		seed += 1e5;
		let a = (seed * 6.12849) % 8.7890975
		let b = (a * 256783945.4758903) % 238462.567890;
		let r = (a * b) % 1;
		return r;
    }
	static noiseTCorrect(t) {
		const f = (x) => (x - 2) * (x + 2) * x;
		return f(-2.31 * t + 1.155) / 6.158 + 0.5;
	}
	static lerp(a, b, t) {
		return a * (1 - t) + b * t;
	}
	static quadLerp(a, b, c, d, tx, ty) {
		const l = Random.lerp(a, c, ty);
		const r = Random.lerp(b, d, ty);
		let per = Random.lerp(l, r, tx);
		return per;
	}
	static cubeLerp(a, b, c, d, a2, b2, c2, d2, tx, ty, tz) {
		let top = Random.quadLerp(a, b, c, d, tx, ty);
		let bottom = Random.quadLerp(a2, b2, c2, d2, tx, ty);
		return Random.lerp(top, bottom, tz);
	}
	static noiseTCorrect(t) {
		const f = (x) => (x - 2) * (x + 2) * x;
		return f(-2.31 * t + 1.155) / 6.158 + 0.5;
	}
	static perlin(x, f = 1, seed = 0) {
		x *= f;
		const s_0 = n => seedRand(seed + Math.floor(n));
		const n = x => Random.lerp(s_0(x), s_0(x + 1), x % 1);
		return n(x);
	}
	static perlin2D(x, y, f = 1, seed = 0) {
		x *= f;
		y *= f;
		const s_p = (x, y) => seedRand(Math.floor(x) + Math.floor(y) * 2000 + seed * 100000);
		const n = (x, y) => Random.quadLerp(s_p(x, y), s_p(x + 1, y), s_p(x, y + 1), s_p(x + 1, y + 1), Random.noiseTCorrect(x % 1), Random.noiseTCorrect(y % 1));
		return n(x, y);
	}
	static perlin3D(x, y, z, f = 1, seed = 0) {
		x *= f;
		y *= f;
		z *= f;
		const s_p = (x, y, z) => rand(rand(Math.floor(x)) + rand(Math.floor(y) * 2000) + rand(Math.floor(z) * 2000000) + seed * 100000);
		const n = (x, y, z) => Random.cubeLerp(
			s_p(x, y, z), s_p(x + 1, y, z), s_p(x, y + 1, z), s_p(x + 1, y + 1, z),
			s_p(x, y, z + 1), s_p(x + 1, y, z + 1), s_p(x, y + 1, z + 1), s_p(x + 1, y + 1, z + 1),
			x % 1, y % 1, z % 1);
		return n(x, y, z);
    }
    static getVoronoiCell(x) {
        return { x: Math.floor(x) + rand(Math.floor(x)) };
    }
	static voronoi(x, f = 1) {
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
			x: Math.floor(x) + rand(Math.floor(x) + Math.floor(y) * 1000),
			y: Math.floor(y) + rand(Math.floor(y) + Math.floor(x) * 10000)
		};
	}
	static voronoi2D(x, y, f = 1) {
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
			x: Math.floor(x) + rand(Math.floor(x) + Math.floor(y) * 1000 + Math.floor(z) * 10000),
			y: Math.floor(y) + rand(Math.floor(y) + Math.floor(x) * 1000000 + Math.floor(z) * 900),
			z: Math.floor(z) + rand(Math.floor(y) * 10000 + Math.floor(x) * 100 + Math.floor(z) * 90000)
		};
	}
	static voronoi3D(x, y, z, f = 1) {
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