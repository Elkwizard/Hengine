/**
 * Represents a 3 by 3 matrix for use with 2D vectors in homogenous coordinates.
 * Due to its use with 2D vectors, the last row of the matrix is unused and will always be [ 0 0 1 ].
 * ```js
 * const transformation = Matrix3.mulMatrices([
 * 	Matrix3.translation(10, 5),
 * 	Matrix3.rotation(Math.PI)
 * ]);
 * 
 * const initialPoint = new Vector2(10, 20);
 * 
 * const finalPoint = transformation.times(initialPoint);
 * console.log(finalPoint); // (0, -15)
 * 
 * const initialAgain = transformation.inverse.times(finalPoint);
 * console.log(initialAgain); // (10, 20)
 * ```
 * @prop Number m[R][C] | The matrix element in row R and column C (0-indexed).
 */
class Matrix3 extends Float64Array {
	/**
	 * Creates a new Matrix3.
	 * All arguments are optional and default to their values for an identity matrix.
	 * @param Number m00? | The matrix element in row 0 and column 0  
	 * @param Number m01? | The matrix element in row 0 and column 1  
	 * @param Number m02? | The matrix element in row 0 and column 2  
	 * @param Number m10? | The matrix element in row 1 and column 0  
	 * @param Number m11? | The matrix element in row 1 and column 1  
	 * @param Number m12? | The matrix element in row 1 and column 2  
	 * @param Number m20? | The matrix element in row 2 and column 0  
	 * @param Number m21? | The matrix element in row 2 and column 1  
	 * @param Number m22? | The matrix element in row 2 and column 2  
	 */
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
	/**
	 * Returns the determinant of the matrix.
	 * @return Number
	 */
	get determinant() {
		const [
			a, d, g,
			b, e, h,
			c, f, i
		] = this;

		return a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g);
	}
	/**
	 * Returns a matrix which is the transpose of the caller.
	 * @return Matrix3
	 */
	get transposed() {
		return this.get().transpose();
	}
	/**
	 * Returns a matrix which is the inverse of the caller, or null if there is none.
	 * @return Matrix3/null
	 */
	get inverse() {
		return this.get().invert();
	}
	/**
	 * Transposes the matrix in-place and returns it.
	 * @return Matrix3
	 */
	transpose() {
		return Matrix3.create(...this, this);
	}
	/**
	 * Inverts the matrix in-place and returns it.
	 * If the matrix isn't invertible, the caller is unchanged and null is returned.
	 * @return Matrix3
	 */
	invert() {
		const { determinant } = this;
		if (determinant) {

			// minors
			const minors = new Matrix3();
			const getIndex = (row, column) => column * 3 + row;
			const getMinor = (row, column) => {
				const firstRow = row ? 0 : 1;
				const firstColumn = column ? 0 : 1;
				const lastRow = (row === 2) ? 1 : 2;
				const lastColumn = (column === 2) ? 1 : 2;
				const a = this[getIndex(firstRow, firstColumn)];
				const b = this[getIndex(firstRow, lastColumn)];
				const c = this[getIndex(lastRow, firstColumn)];
				const d = this[getIndex(lastRow, lastColumn)];

				return a * d - b * c;
			};
			for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++)
				minors[getIndex(r, c)] = getMinor(r, c);

			// cofactors
			for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++)
				if ((r + (c % 2)) % 2 === 1) minors[getIndex(r, c)] *= -1;

			// adjugate
			minors.transpose();

			// downscale
			return minors.times(1 / determinant, this);
		} else return null;
	}
	/**
	 * Multiplies the matrix in-place by another mathematical object on the right side.
	 * @signature
	 * @param Matrix3 matrix | Another matrix to multiply with
	 * @signature
	 * @param Vector2 vector | A vector to be transformed by the matrix. To make this multiplication possible, the vector has a 1 added as the last component prior to the multiplication, and after, the last component is removed
	 * @signature
	 * @param Number scale | A number to scale the matrix by.
	 * @return Matrix3/Vector2
	 */
	mul(M1) {
		return this.times(M1, this);
	}
	/**
	 * Returns a copy of the matrix multiplied by another mathematical object optionally copied into a specific destination.
	 * If no destination is provided, one will be created.
	 * @signature
	 * @param Matrix3 matrix | Another matrix to multiply with
	 * @param Matrix3 destination? | The destination for the operation
	 * @signature
	 * @param Vector2 vector | A vector to be transformed by the Matrix3. To make this multiplication possible, the vector has a 1 added as the last component prior to the multiplication, and after, the last component is removed
	 * @param Vector2 destination? | The destination for the operation
	 * @signature
	 * @param Number scale | A number to scale the matrix by.
	 * @param Matrix3 destination? | The destination for the operation
	 * @return Matrix3
	 */
	times(M1, result = null) {
		if (M1 instanceof Vector2) {
			result ??= new Vector2(0);
			const x = this[0] * M1.x + this[3] * M1.y + this[6];
			const y = this[1] * M1.x + this[4] * M1.y + this[7];
			result.x = x;
			result.y = y;
			return result;	
		} else if (M1 instanceof Matrix3) {
			const m00 = this[0] * M1[0] + this[3] * M1[1] + this[6] * M1[2];
			const m01 = this[0] * M1[3] + this[3] * M1[4] + this[6] * M1[5];
			const m02 = this[0] * M1[6] + this[3] * M1[7] + this[6] * M1[8];
			const m10 = this[1] * M1[0] + this[4] * M1[1] + this[7] * M1[2];
			const m11 = this[1] * M1[3] + this[4] * M1[4] + this[7] * M1[5];
			const m12 = this[1] * M1[6] + this[4] * M1[7] + this[7] * M1[8];
			const m20 = this[2] * M1[0] + this[5] * M1[1] + this[8] * M1[2];
			const m21 = this[2] * M1[3] + this[5] * M1[4] + this[8] * M1[5];
			const m22 = this[2] * M1[6] + this[5] * M1[7] + this[8] * M1[8];
			return Matrix3.create(
				m00, m01, m02,
				m10, m11, m12,
				m20, m21, m22,
				result ?? new Matrix3()
			);
		} else if (M1 instanceof Vector3) {
			result ??= new Vector3(0);
			const x = this[0] * M1.x + this[3] * M1.y + this[6] * M1.z;
			const y = this[1] * M1.x + this[4] * M1.y + this[7] * M1.z;
			const z = this[2] * M1.x + this[5] * M1.y + this[8] * M1.z;	
			result.x = x;
			result.y = y;
			result.z = z;
			return result;
		} else if (typeof M1 === "number") {
			return Matrix3.create(
				this[0] * M1, this[3] * M1, this[6] * M1,
				this[1] * M1, this[4] * M1, this[7] * M1,
				this[2] * M1, this[5] * M1, this[8] * M1,
				result ?? new Matrix3()
			);
		}
	}
	/**
	 * Creates a copy of the matrix and optionally stores it in a provided destination.
	 * @param Matrix3 destination? | The destination to copy the matrix into.
	 * @return Matrix3
	 */
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
	/**
	 * Converts the matrix to a CSS matrix string.
	 * @return String
	 */
	toCSS() {
		return `matrix(${this[0]}, ${this[1]}, ${this[3]}, ${this[4]}, ${this[6]}, ${this[7]})`;
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
	/**
	 * Creates an identity matrix and optionally stores it in a provided destination.
	 * @param Matrix3 destination? | The matrix to copy the identity matrix into 
	 * @return Matrix3
	 */
	static identity(result) {
		return Matrix3.create(
			1, 0, 0,
			0, 1, 0,
			0, 0, 1,
			result
		);
	}
	/**
	 * Creates a 2D rotation matrix and optionally stores it in a provided destination.
	 * @param Number theta | The clockwise (in screen space) angle (in radians) to rotate by  
	 * @param Matrix3 result? | The matrix to copy the rotation matrix into
	 * @return Matrix3
	 */
	static rotation(t, result) {
		const c = Math.cos(t);
		const s = Math.sin(t);
		return Matrix3.create(
			c, -s, 0,
			s, c, 0,
			0, 0, 1,
			result
		);
	}
	/**
	 * Creates a 2D scaling matrix and optionally stores it in a provided a destination.
	 * @signature
	 * @param Number x | The scale factor on the x axis
	 * @param Number y | The scale factor on the y axis
	 * @param Matrix3 result? | The matrix to copy the scaling matrix into 
	 * @signature
	 * @param Vector2 vector | A vector containing the scale factors for both axes
	 * @param Matrix3 result? | The matrix to copy the scaling matrix into 
	 * @return Matrix3
	 */
	static scale(x, y, result) {
		if (typeof y === "object" || y === undefined)
			return Matrix3.create(
				x, 0, 0,
				0, x, 0,
				0, 0, 1,
				y
			);
		
		return Matrix3.create(
			x, 0, 0,
			0, y, 0,
			0, 0, 1,
			result
		);
	}
	/**
	 * Creates a 2D translation matrix and optionally stores it in a provided a destination.
	 * @signature
	 * @param Number x | The x coordinate to translate by
	 * @param Number y | The y coordinate to translate by
	 * @param Matrix3 result? | The matrix to copy the translation matrix into 
	 * @signature
	 * @param Vector2 vector | The vector to translate by
	 * @param Matrix3 result? | The matrix to copy the translation matrix into 
	 * @return Matrix3
	 */
	static translation(x, y, result) {
		if (typeof x === "object") {
			return Matrix3.create(
				1, 0, x.x,
				0, 1, x.y,
				0, 0, 1,
				y
			)
		}
		return Matrix3.create(
			1, 0, x,
			0, 1, y,
			0, 0, 1,
			result
		);
	}
	/**
	 * Multiplies a series of matrices together and optionally stores it in a provided destination.
	 * @param Matrix3[] matrices | The matrices to multiply together. Order matters for this argument
	 * @param Matrix3 result? | The matrix to copy the result into
	 * @return Matrix3
	 */
	static mulMatrices(matrices, result = new Matrix3()) {
		if (matrices.length === 1) return matrices[0].get(result);
		matrices[matrices.length - 2].times(matrices[matrices.length - 1], result);
		for (let i = matrices.length - 3; i >= 0; i--) matrices[i].times(result, result);
		return result;
	}
}
{ // create toString methods
	const methods = ["toString", "toFixed", "toMaxed"];
	for (let i = 0; i < methods.length; i++) {
		const method = methods[i];
		Matrix3.prototype[method] = function (count) {
			if (method === "toString") count = 10;
			const n = [...this].map(v => v[method](count));
			const max0 = Math.max(n[0].length, n[1].length, n[2].length);
			const max1 = Math.max(n[3].length, n[4].length, n[5].length);
			const max2 = Math.max(n[6].length, n[7].length, n[8].length);
			const fullspan = max0 + max1 + max2 + 6;
			const pad = (string, length) => {
				const empty = length - string.length;
				const left = Math.ceil(empty / 2);
				const right = empty - left;
				return " ".repeat(left) + string + " ".repeat(right);
			};
			return `
┌${                 " ".repeat(fullspan)                    }┐
│ ${pad(n[0], max0)}  ${pad(n[3], max1)}  ${pad(n[6], max2)} │
│ ${pad(n[1], max0)}  ${pad(n[4], max1)}  ${pad(n[7], max2)} │
│ ${pad(n[2], max0)}  ${pad(n[5], max1)}  ${pad(n[8], max2)} │
└${                " ".repeat(fullspan)                     }┘
`.trim();
		};
	}
};
Matrix3.temp = [
	Matrix3.identity(),
	Matrix3.identity(),
	Matrix3.identity()
];