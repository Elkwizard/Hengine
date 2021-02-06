class Matrix3 extends Float64Array {
	constructor(
		m00 = 1, m01 = 0, m02 = 0,
		m10 = 0, m11 = 1, m12 = 0,
		m20 = 0, m21 = 0, m22 = 1
	) {
		super(9);
		this[0] = m00;
		this[3] = m01;
		this[6] = m02;
		this[1] = m10;
		this[4] = m11;
		this[7] = m12;
		this[2] = m20;
		this[5] = m21;
		this[8] = m22;
	}
	set m00(a) { this[0] = a; }
	get m00() { return this[0]; } 
	set m01(a) { this[3] = a; } 
	get m01() { return this[3]; } 
	set m02(a) { this[6] = a; } 
	get m02() { return this[6]; } 
	set m10(a) { this[1] = a; } 
	get m10() { return this[1]; } 
	set m11(a) { this[4] = a; } 
	get m11() { return this[4]; } 
	set m12(a) { this[7] = a; } 
	get m12() { return this[7]; } 
	set m20(a) { this[2] = a; } 
	get m20() { return this[2]; } 
	set m21(a) { this[5] = a; } 
	get m21() { return this[5]; } 
	set m22(a) { this[8] = a; } 
	get m22() { return this[8]; } 
	get(result = new Matrix3()) {
		result[0] = this[0];
		result[1] = this[1];
		result[2] = this[2];
		result[3] = this[3];
		result[4] = this[4];
		result[5] = this[5];
		result[6] = this[6];
		result[7] = this[7];
		result[8] = this[8];
		return result;
	}
	toString() {
		const [topleft, topright, bottomleft, bottomright, vertical] = [9484, 9488, 9492, 9496, 9474].map(num => String.fromCharCode(num));
		let n = [...this].map(n => n.toMaxed(2));
		let max0 = Math.max(n[0].length, n[3].length, n[6].length);
		let max1 = Math.max(n[1].length, n[4].length, n[7].length);
		let max2 = Math.max(n[2].length, n[5].length, n[8].length);
		let fullspan = max0 + max1 + max2 + 4;
		let top = `${topleft}${" ".repeat(fullspan)}${topright}`;
		let middle0 = `${vertical} ${n[0].pad(max0)} ${n[3].pad(max1)} ${n[6].pad(max2)} ${vertical}`;
		let middle1 = `${vertical} ${n[1].pad(max0)} ${n[4].pad(max1)} ${n[7].pad(max2)} ${vertical}`;
		let middle2 = `${vertical} ${n[2].pad(max0)} ${n[5].pad(max1)} ${n[8].pad(max2)} ${vertical}`;
		let bottom = `${bottomleft}${" ".repeat(fullspan)}${bottomright}`;

		return `${top}
${middle0}
${middle1}
${middle2}
${bottom}`;
	}
	static create(m00, m01, m02, m10, m11, m12, m20, m21, m22, result = new Matrix3()) {
		result[0] = m00;
		result[3] = m01;
		result[6] = m02;
		result[1] = m10;
		result[4] = m11;
		result[7] = m12;
		result[2] = m20;
		result[5] = m21;
		result[8] = m22;
		return result;
	}
	static identity(result = new Matrix3()) {
		return Matrix3.create(
			1, 0, 0,
			0, 1, 0,
			0, 0, 1,
			result
		);
	}
	static mulPoint(m, p, result = new Vector2(0)) {
		const x = m[0] * p.x + m[3] * p.y + m[6];
		const y = m[1] * p.x + m[4] * p.y + m[7];
		result.x = x;
		result.y = y;
		return result;
	}
	static rotation(t, result = new Matrix3()) {
		const c = Math.cos(t);
		const s = Math.sin(t);
		return Matrix3.create(
			c, -s, 0,
			s, c, 0,
			0, 0, 1,
			result
		);
	}
	static scale(x, y, result = new Matrix3()) {
		return Matrix3.create(
			x, 0, 0,
			0, y, 0,
			0, 0, 1,
			result
		);
	}
	static translation(x, y, result = new Matrix3()) {
		return Matrix3.create(
			1, 0, x,
			0, 1, y,
			0, 0, 1,
			result
		);
	}
	static fromTransform(transf, result = new Matrix3()) {
		return Matrix3.create(
			transf.cosRotation, -transf.sinRotation, 	transf.position.x,
			transf.sinRotation, transf.cosRotation, 	transf.position.y,
			0,					0,						1,
			result
		);
	}
	static mulMatrix(M0, M1, result = new Matrix3()) {
		const m00 = M0[0] * M1[0] + M0[3] * M1[1] + M0[6] * M1[2];
		const m01 = M0[0] * M1[3] + M0[3] * M1[4] + M0[6] * M1[5];
		const m02 = M0[0] * M1[6] + M0[3] * M1[7] + M0[6] * M1[8];
		const m10 = M0[1] * M1[0] + M0[4] * M1[1] + M0[7] * M1[2];
		const m11 = M0[1] * M1[3] + M0[4] * M1[4] + M0[7] * M1[5];
		const m12 = M0[1] * M1[6] + M0[4] * M1[7] + M0[7] * M1[8];
		const m20 = M0[2] * M1[0] + M0[5] * M1[1] + M0[8] * M1[2];
		const m21 = M0[2] * M1[3] + M0[5] * M1[4] + M0[8] * M1[5];
		const m22 = M0[2] * M1[6] + M0[5] * M1[7] + M0[8] * M1[8];
		return Matrix3.create(
			m00, m01, m02,
			m10, m11, m12,
			m20, m21, m22,
			result
		);
	}
	static mulMatrices(matrices, result = new Matrix3()) {
		Matrix3.mulMatrix(matrices[matrices.length - 2], matrices[matrices.length - 1], result);
		for (let i = matrices.length - 3; i >= 0; i--) Matrix3.mulMatrix(matrices[i], result, result);
		return result;
	}
}
Matrix3.temp = [
	Matrix3.identity(),
	Matrix3.identity(),
	Matrix3.identity()
];