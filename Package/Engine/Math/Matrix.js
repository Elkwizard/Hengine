class Matrix3 {
	static identity() {
		return [
			1, 0, 0,
			0, 1, 0,
			0, 0, 1
		];
	}
	static mulPoint(m, p) {
		let x = m[0] * p.x + m[3] * p.y + m[6];
		let y = m[1] * p.x + m[4] * p.y + m[7];
		return new Vector2(x, y);
	}
	static rotation(t) {
		let c = Math.cos(-t);
		let s = Math.sin(-t);
		return [
			c,	-s,	0,
			s,	c,	0,
			0,	0,	1
		];
	}
	static scale(x, y) {
		return [
			x, 0, 0,
			0, y, 0,
			0, 0, 1
		];
	}
	static translation(x, y) {
		return [
			1, 0, 0,
			0, 1, 0,
			x, y, 1
		];
	}
	static mulMatrix(M0, M1) {
		let m00 = M0[0] * M1[0] + M0[1] * M1[3] + M0[2] * M1[6];
		let m01 = M0[0] * M1[1] + M0[1] * M1[4] + M0[2] * M1[7];
		let m02 = M0[0] * M1[2] + M0[1] * M1[5] + M0[2] * M1[8];
		let m10 = M0[3] * M1[0] + M0[4] * M1[3] + M0[5] * M1[6];
		let m11 = M0[3] * M1[1] + M0[4] * M1[4] + M0[5] * M1[7];
		let m12 = M0[3] * M1[2] + M0[4] * M1[5] + M0[5] * M1[8];
		let m20 = M0[6] * M1[0] + M0[7] * M1[3] + M0[8] * M1[6];
		let m21 = M0[6] * M1[1] + M0[7] * M1[4] + M0[8] * M1[7];
		let m22 = M0[6] * M1[2] + M0[7] * M1[5] + M0[8] * M1[8];
		return [
			m00, m01, m02,
			m10, m11, m12,
			m20, m21, m22
		];
	}
	static mulMatrices(matrices) {
		let matrix = matrices[0];
		for (let i = 1; i < matrices.length; i++) matrix = Matrix3.mulMatrix(matrix, matrices[i]);
		return matrix;
	}
	static stringify(m) {
		const [topleft, topright, bottomleft, bottomright, vertical] = [9484, 9488, 9492, 9496, 9474].map(num => String.fromCharCode(num));
		let n = m.map(n => n.toMaxed(2));
		let max0 = Math.max(n[0].length, n[3].length, n[6].length);
		let max1 = Math.max(n[1].length, n[4].length, n[7].length);
		let max2 = Math.max(n[2].length, n[5].length, n[8].length);
		let fullspan = max0 + max1 + max2 + 4;
		let top = `${topleft}${" ".repeat(fullspan)}${topright}`;
		let middle0 = `${vertical} ${n[0].pad(max0)} ${n[1].pad(max1)} ${n[2].pad(max2)} ${vertical}`;
		let middle1 = `${vertical} ${n[3].pad(max0)} ${n[4].pad(max1)} ${n[5].pad(max2)} ${vertical}`;
		let middle2 = `${vertical} ${n[6].pad(max0)} ${n[7].pad(max1)} ${n[8].pad(max2)} ${vertical}`;
		let bottom = `${bottomleft}${" ".repeat(fullspan)}${bottomright}`;

		return `${top}
${middle0}
${middle1}
${middle2}
${bottom}`;
	}
}
class Matrix4 {
	static identity() {
		return [
			1, 0, 0, 0,
			0, 1, 0, 0,
			0, 0, 1, 0,
			0, 0, 0, 1
		];
	}
	static mulPoint(m, p) {
		let x = m[0] * p.x + m[4] * p.y + m[8] * p.z + m[12];
		let y = m[1] * p.x + m[5] * p.y + m[9] * p.z + m[13];
		let z = m[2] * p.x + m[6] * p.y + m[10] * p.z + m[14];
		return new Vector3(x, y, z);
	}
	static mulMatrix(M0, M1) {
		let m00 = M0[0] * M1[0] + M0[1] * M1[4] + M0[2] * M1[8] + M0[3] * M1[12];
		let m01 = M0[0] * M1[1] + M0[1] * M1[5] + M0[2] * M1[9] + M0[3] * M1[13];
		let m02 = M0[0] * M1[2] + M0[1] * M1[6] + M0[2] * M1[10] + M0[3] * M1[14];
		let m03 = M0[0] * M1[3] + M0[1] * M1[7] + M0[2] * M1[11] + M0[3] * M1[15];
		let m10 = M0[4] * M1[0] + M0[5] * M1[4] + M0[6] * M1[8] + M0[7] * M1[12];
		let m11 = M0[4] * M1[1] + M0[5] * M1[5] + M0[6] * M1[9] + M0[7] * M1[13];
		let m12 = M0[4] * M1[2] + M0[5] * M1[6] + M0[6] * M1[10] + M0[7] * M1[14];
		let m13 = M0[4] * M1[3] + M0[5] * M1[7] + M0[6] * M1[11] + M0[7] * M1[15];
		let m20 = M0[8] * M1[0] + M0[9] * M1[4] + M0[10] * M1[8] + M0[11] * M1[12];
		let m21 = M0[8] * M1[1] + M0[9] * M1[5] + M0[10] * M1[9] + M0[11] * M1[13];
		let m22 = M0[8] * M1[2] + M0[9] * M1[6] + M0[10] * M1[10] + M0[11] * M1[14];
		let m23 = M0[8] * M1[3] + M0[9] * M1[7] + M0[10] * M1[11] + M0[11] * M1[15];
		let m30 = M0[12] * M1[0] + M0[13] * M1[4] + M0[14] * M1[8] + M0[15] * M1[12];
		let m31 = M0[12] * M1[1] + M0[13] * M1[5] + M0[14] * M1[9] + M0[15] * M1[13];
		let m32 = M0[12] * M1[2] + M0[13] * M1[6] + M0[14] * M1[10] + M0[15] * M1[14];
		let m33 = M0[12] * M1[3] + M0[13] * M1[7] + M0[14] * M1[11] + M0[15] * M1[15];
		return [
			m00, m01, m02, m03,
			m10, m11, m12, m13,
			m20, m21, m22, m23,
			m30, m31, m32, m33
		];
	}
	static mulMatrixString(m, m2) {
		let m00 = `(${m[0]} * ${m2[0]} + ${m[1]} * ${m2[4]} + ${m[2]} * ${m2[8]} + ${m[3]} * ${m2[12]})`;
		let m10 = `(${m[0]} * ${m2[1]} + ${m[1]} * ${m2[5]} + ${m[2]} * ${m2[9]} + ${m[3]} * ${m2[13]})`;
		let m20 = `(${m[0]} * ${m2[2]} + ${m[1]} * ${m2[6]} + ${m[2]} * ${m2[10]} + ${m[3]} * ${m2[14]})`;
		let m30 = `(${m[0]} * ${m2[3]} + ${m[1]} * ${m2[7]} + ${m[2]} * ${m2[11]} + ${m[3]} * ${m2[15]})`;
		let m01 = `(${m[4]} * ${m2[0]} + ${m[5]} * ${m2[4]} + ${m[6]} * ${m2[8]} + ${m[7]} * ${m2[12]})`;
		let m11 = `(${m[4]} * ${m2[1]} + ${m[5]} * ${m2[5]} + ${m[6]} * ${m2[9]} + ${m[7]} * ${m2[13]})`;
		let m21 = `(${m[4]} * ${m2[2]} + ${m[5]} * ${m2[6]} + ${m[6]} * ${m2[10]} + ${m[7]} * ${m2[14]})`;
		let m31 = `(${m[4]} * ${m2[3]} + ${m[5]} * ${m2[7]} + ${m[6]} * ${m2[11]} + ${m[7]} * ${m2[15]})`;
		let m02 = `(${m[8]} * ${m2[0]} + ${m[9]} * ${m2[4]} + ${m[10]} * ${m2[8]} + ${m[11]} * ${m2[12]})`;
		let m12 = `(${m[8]} * ${m2[1]} + ${m[9]} * ${m2[5]} + ${m[10]} * ${m2[9]} + ${m[11]} * ${m2[13]})`;
		let m22 = `(${m[8]} * ${m2[2]} + ${m[9]} * ${m2[6]} + ${m[10]} * ${m2[10]} + ${m[11]} * ${m2[14]})`;
		let m32 = `(${m[8]} * ${m2[3]} + ${m[9]} * ${m2[7]} + ${m[10]} * ${m2[11]} + ${m[11]} * ${m2[15]})`;
		let m03 = `(${m[12]} * ${m2[0]} + ${m[13]} * ${m2[4]} + ${m[14]} * ${m2[8]} + ${m[15]} * ${m2[12]})`;
		let m13 = `(${m[12]} * ${m2[1]} + ${m[13]} * ${m2[5]} + ${m[14]} * ${m2[9]} + ${m[15]} * ${m2[13]})`;
		let m23 = `(${m[12]} * ${m2[2]} + ${m[13]} * ${m2[6]} + ${m[14]} * ${m2[10]} + ${m[15]} * ${m2[14]})`;
		let m33 = `(${m[12]} * ${m2[3]} + ${m[13]} * ${m2[7]} + ${m[14]} * ${m2[11]} + ${m[15]} * ${m2[15]})`;
		return [
			m00, m10, m20, m30,
			m01, m11, m21, m31,
			m02, m12, m22, m32,
			m03, m13, m23, m33,
		];
	}
	static scale(x, y, z) {
		return [
			x, 0, 0, 0,
			0, y, 0, 0,
			0, 0, z, 0,
			0, 0, 0, 1
		];
	}
	static rotationX(x) {
		let cx = Math.cos(x);
		let sx = Math.sin(x);
		return [
			1, 0, 0, 0,
			0, cx, -sx, 0,
			0, sx, cx, 0,
			0, 0, 0, 1
		];
	}
	static rotationY(y) {
		let cy = Math.cos(y);
		let sy = Math.sin(y);
		return [
			cy, 0, sy, 0,
			0, 1, 0, 0,
			-sy, 0, cy, 0,
			0, 0, 0, 1
		];
	}
	static rotationZ(z) {
		let cz = Math.cos(z);
		let sz = Math.sin(z);
		return [
			cz, -sz, 0, 0,
			sz, cz, 0, 0,
			0, 0, 1, 0,
			0, 0, 0, 1
		];
	}
	static rotation(x, y, z) {
		x *= -1;
		z *= -1;
		let cx = Math.cos(x);
		let sx = Math.sin(x);
		let cy = Math.cos(y);
		let sy = Math.sin(y);
		let cz = Math.cos(z);
		let sz = Math.sin(z);
		return [
			cz * cy,		cz * sy * sx + -sz * cx,	cz * sy * cx + sz * sx,		0,
			sz * cy,		sz * sy * sx + cz * cx,		sz * sy * cx + cz * -sx,	0,
			-sy,			cy * sx,					cy * cx,					0,
			0,				0,							0,							1
		];
	}
	static translation(x, y, z) {
		return [
			1, 0, 0, 0,
			0, 1, 0, 0,
			0, 0, 1, 0,
			x, y, z, 1
		];
	}
	static glRotation(x, y, z) {
		return Matrix4.rotation(x, y, z);
	}
	static glCamera(ox, oy, oz, rx, ry, rz) {
		return Matrix4.mulMatrix(
			Matrix4.translation(-ox, -oy, -oz),
			Matrix4.glRotation(-rx, -ry, -rz)
		);
	}
	static stringify(m) {
		const [topleft, topright, bottomleft, bottomright, vertical] = [9484, 9488, 9492, 9496, 9474].map(num => String.fromCharCode(num));
		let n = m.map(n => n.toMaxed(2));
		let max0 = Math.max(n[0].length, n[4].length, n[8].length, n[12].length);
		let max1 = Math.max(n[1].length, n[5].length, n[9].length, n[13].length);
		let max2 = Math.max(n[2].length, n[6].length, n[10].length, n[14].length);
		let max3 = Math.max(n[3].length, n[7].length, n[11].length, n[15].length);
		let fullspan = max0 + max1 + max2 + max3 + 5;
		let top = `${topleft}${" ".repeat(fullspan)}${topright}`;
		let middle0 = `${vertical} ${n[0].pad(max0)} ${n[1].pad(max1)} ${n[2].pad(max2)} ${n[3].pad(max3)} ${vertical}`;
		let middle1 = `${vertical} ${n[4].pad(max0)} ${n[5].pad(max1)} ${n[6].pad(max2)} ${n[7].pad(max3)} ${vertical}`;
		let middle2 = `${vertical} ${n[8].pad(max0)} ${n[9].pad(max1)} ${n[10].pad(max2)} ${n[11].pad(max3)} ${vertical}`;
		let middle3 = `${vertical} ${n[12].pad(max0)} ${n[13].pad(max1)} ${n[14].pad(max2)} ${n[15].pad(max3)} ${vertical}`;
		let bottom = `${bottomleft}${" ".repeat(fullspan)}${bottomright}`;

		return `${top}
${middle0}
${middle1}
${middle2}
${middle3}
${bottom}`;
	}
}