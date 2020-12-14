class Matrix3 {
	static matrix(m00, m01, m02, m10, m11, m12, m20, m21, m22, result = new Array(9)) {
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
	static identity(result = new Array(9)) {
		return Matrix3.matrix(
			1, 0, 0,
			0, 1, 0,
			0, 0, 1,
			result
		);
	}
	static mulPoint(m, p, result = new Vector2(0, 0)) {
		let x = m[0] * p.x + m[3] * p.y + m[6];
		let y = m[1] * p.x + m[4] * p.y + m[7];
		result.x = x;
		result.y = y;
		return result;
	}
	static rotation(t, result = new Array(9)) {
		let c = Math.cos(t);
		let s = Math.sin(t);
		return Matrix3.matrix(
			c, -s, 0,
			s, c, 0,
			0, 0, 1,
			result
		);
	}
	static scale(x, y, result = new Array(9)) {
		return Matrix3.matrix(
			x, 0, 0,
			0, y, 0,
			0, 0, 1,
			result
		);
	}
	static translation(x, y, result = new Array(9)) {
		return Matrix3.matrix(
			1, 0, x,
			0, 1, y,
			0, 0, 1,
			result
		);
	}
	static fromTransform(transf, result = new Array(9)) {
		return Matrix3.matrix(
			transf.cosRotation, -transf.sinRotation, 	transf.position.x,
			transf.sinRotation, transf.cosRotation, 	transf.position.y,
			0,					0,						1,
			result
		);
	}
	static mulMatrix(M0, M1, result = new Array(9)) {
		let m00 = M0[0] * M1[0] + M0[3] * M1[1] + M0[6] * M1[2];
		let m01 = M0[0] * M1[3] + M0[3] * M1[4] + M0[6] * M1[5];
		let m02 = M0[0] * M1[6] + M0[3] * M1[7] + M0[6] * M1[8];
		let m10 = M0[1] * M1[0] + M0[4] * M1[1] + M0[7] * M1[2];
		let m11 = M0[1] * M1[3] + M0[4] * M1[4] + M0[7] * M1[5];
		let m12 = M0[1] * M1[6] + M0[4] * M1[7] + M0[7] * M1[8];
		let m20 = M0[2] * M1[0] + M0[5] * M1[1] + M0[8] * M1[2];
		let m21 = M0[2] * M1[3] + M0[5] * M1[4] + M0[8] * M1[5];
		let m22 = M0[2] * M1[6] + M0[5] * M1[7] + M0[8] * M1[8];
		return Matrix3.matrix(
			m00, m01, m02,
			m10, m11, m12,
			m20, m21, m22,
			result
		);
	}
	static mulMatrices(matrices, result = new Array(9)) {
		Matrix3.mulMatrix(matrices[matrices.length - 2], matrices[matrices.length - 1], result);
		for (let i = matrices.length - 3; i >= 0; i--) Matrix3.mulMatrix(matrices[i], result, result);
		return result;
	}
	static copy(m, result = new Array(9)) {
		return Matrix3.matrix(
			m[0], m[3], m[6],
			m[1], m[4], m[7],
			m[2], m[5], m[8],
			result
		);
	}
	static stringify(m) {
		const [topleft, topright, bottomleft, bottomright, vertical] = [9484, 9488, 9492, 9496, 9474].map(num => String.fromCharCode(num));
		let n = m.map(n => n.toMaxed(2));
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
}
Matrix3.temp = [
	Matrix3.identity(),
	Matrix3.identity(),
	Matrix3.identity()
];