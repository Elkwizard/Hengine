/**
 * @implements Copyable, Serializable
 * Represents an N by N square matrix which can be used to transform vectors of dimension N or (N - 1) via homogenous coordinates.
 * @abstract
 */
class Matrix extends Float64Array {
	/**
	 * Creates a new Matrix. Since this class is abstract, this constructor can only be used via its subclasses.
	 * @signature
	 * @param Number[] ...elements | The elements of the matrix, in row-major object
	 * @signature
	 * @param Vector[] ...columns | The columns of the matrix
	 * @signature
	 * @param Matrix base? | A matrix of less or equal dimension. If specified, the constructed matrix will be an identity matrix with the elements of this argument superimposed on it from the upper-left. Otherwise, the constructed matrix will be an unaltered identity matrix
	 */
	constructor(size, args) {
		super(size * size);
		if (args.length === this.length)
			for (let i = 0; i < size; i++)
				for (let j = 0; j < size; j++)
					this[i * size + j] = args[j * size + i];
		else if (args.length > 1) {
			const { modValues } = args[0].constructor;
			for (let i = 0; i < size; i++)
				for (let j = 0; j < size; j++)
					this[i * size + j] = args[i]?.[modValues[j]] ?? +(i === j);
		} else {
			for (let i = 0; i < size; i++)
				this[i + i * size] = 1;

			if (args.length) {
				const matrix = args[0];
				const s = matrix.constructor.size;
				for (let i = 0; i < s; i++)
				for (let j = 0; j < s; j++)
					this[i * size + j] = matrix[i * s + j];
			}
		}
	}
	/**
	 * Returns a transposed copy of the caller.
	 * @return Matrix
	 */
	get transposed() {
		return this.get().transpose();
	}
	/**
	 * Returns a inverted copy of the caller, or null if the caller is singular.
	 * @return Matrix/null
	 */
	get inverse() {
		return this.get().invert();
	}
	/**
	 * Returns the determinant of the caller.
	 * @return Number
	 */
	get determinant() {
		return 0;
	}
	get(result = new this.constructor()) {
		result.set(this);
		return result;
	}
	/**
	 * Transposes the matrix in-place (swapping rows with columns) and returns it.
	 * @return Matrix
	 */
	transpose() {
		return this.constructor.create(...this, this);
	}
	/**
	 * If the caller is invertible, this inverts the caller in-place and returns it, otherwise returns null.
	 * @return Matrix/null
	 */
	invert() {
		return null;
	}
	/**
	 * Retrieves an element from the caller at a given position.
	 * @param Number row | The 0-based row index
	 * @param Number column | The 0-based column index
	 * @return Number
	 */
	at(row, column) {
		return this[column * this.constructor.size + row];
	}
	/**
	 * Replaces an element of the caller at a given position with a new value.
	 * @param Number row | The 0-based row index
	 * @param Number column | The 0-based column index
	 * @param Number value | The new element value
	 */
	update(row, column, value) {
		this[column * this.constructor.size + row] = value;
	}
	/**
	 * Retrieves a column of the caller.
	 * @param Number column | The 0-based column index
	 * @return Vector
	 */
	column(column) {
		const { size, Vector } = this.constructor;
		const result = new Vector();
		const { modValues } = Vector;
		for (let i = 0; i < size; i++)
			result[modValues[i]] = this[column * size + i];
		return result;
	}
	/**
	 * Retrieves a row of the caller.
	 * @param Number row | The 0-based row index
	 * @return Vector
	 */
	row(row) {
		const { size, Vector } = this.constructor;
		const result = new Vector();
		const { modValues } = Vector;
		for (let i = 0; i < size; i++)
			result[modValues[i]] = this[i * size + row];
		return result;
	}
	op(other, op, dst = new this.constructor()) {
		if (typeof other === "number")
			for (let i = 0; i < this.length; i++)
				dst[i] = op(this[i], other);
		else for (let i = 0; i < this.length; i++)
			dst[i] = op(this[i], other[i]);
		return dst;
	}
	/**
	 * @group plus/minus
	 * Computes the sum or difference between the caller and a given object, and returns the result.
	 * @param Matrix/Number other | The right-hand operand of the sum
	 * @param Matrix result? | A matrix to optionally store the result in. If not specified, a new matrix will be created
	 * @return Matrix
	 */
	plus(other, dst) {
		return this.op(other, Operable.addFunc, dst);
	}
	minus(other, dst) {
		return this.op(other, Operable.subFunc, dst);
	}
	/**
	 * @group add/sub
	 * Adds or subtracts a given object from the caller in-place and returns it.
	 * @param Matrix/Number other | The right-hand operand of the sum
	 * @return Matrix
	 */
	add(other) {
		return this.plus(other, this);
	}
	sub(other) {
		return this.minus(other, this);
	}
	/**
	 * Multiplies the caller in-place with another object.
	 * Returns the caller.
	 * @param Matrix/Number other | The right-hand operand of the product
	 * @return Matrix
	 */
	mul(other) {
		return this.times(other, this);
	}
	timesNumber(number, dst) {
		for (let i = 0; i < this.length; i++)
			dst[i] = this[i] * number;
	}
	timesVector(vector, dst) {
		const { size } = this.constructor;
		const { modValues } = vector.constructor;
		const result = new vector.constructor();
		for (let i = 0; i < modValues.length; i++) {
			let sum = 0;
			for (let j = 0; j < size; j++)
				sum += (vector[modValues[j]] ?? 1) * this[j * size + i];
			result[modValues[i]] = sum;
		}
		result.get(dst);
	}
	timesMatrix(matrix, dst) {
		const { size } = this.constructor;
		const result = new matrix.constructor();
		for (let c = 0; c < size; c++)
		for (let r = 0; r < size; r++) {
			let sum = 0;
			for (let k = 0; k < size; k++)
				sum += this[k * size + r] * matrix[c * size + k];
			result[c * size + r] = sum;
		}
		result.get(dst);
	}
	/**
	 * Computes the product of the caller and another object and returns the result.
	 * @param Matrix/Vector/Number other | The right-hand side of the product. If this is a vector of dimension N - 1, it will be converted to and from homogenous coordinates to facilitate the multiplication 
	 * @param Matrix/Vector result? | A destination to optionally store the result in. If not specified, the result will be a new vector or matrix
	 * @return Matrix/Vector/Number
	 */
	times(other, dst) {
		if (other instanceof Vector) {
			dst ??= new other.constructor();
			this.timesVector(other, dst);
		} else {
			dst ??= new this.constructor();
			if (other instanceof Matrix)
				this.timesMatrix(other, dst);
			else this.timesNumber(other, dst);
		}
		return dst;
	}
	toByteBuffer(buffer = new ByteBuffer()) {
		for (let i = 0; i < this.length; i++)
			buffer.write.float64(this[i]);
		return buffer;
	}
	fromByteBuffer(buffer) {
		const result = new this();
		for (let i = 0; i < result.length; i++)
			result[i] = buffer.read.float64();
		return result;
	}
	/**
	 * Creates an N or N - 1 dimensional homogenous scaling matrix and optionally stores it in a provided destination.
	 * @signature
	 * @param Number[] ...axes | The scale factor along each of the axes 
	 * @param Matrix result? | The matrix to copy the scaling matrix into 
	 * @signature
	 * @param Vector vector | A vector where each component specifies the scale factor on its corresponding axis
	 * @param Matrix result? | The matrix to copy the scaling matrix into 
	 * @return Matrix
	 */
	static scale(...axes) {
		const result = axes.last instanceof this ? this.identity(axes.pop()) : new this();
		if (axes[0] instanceof Vector)
			axes = axes[0].values;

		const { size } = this;
		for (let i = 0; i < size; i++)
			result[i * size + i] = axes[i];
		return result;
	}
	/**
	 * Creates a N - 1 dimensional homogenous translation matrix and optionally stores it in a provided destination.
	 * @signature
	 * @param Number[] ...axes | The translation along each of the N - 1 axes 
	 * @param Matrix result? | The matrix to copy the translation matrix into 
	 * @signature
	 * @param Vector vector | The N - 1 dimensional vector to translate by
	 * @param Matrix result? | The matrix to copy the translation matrix into 
	 * @return Matrix
	 */
	static translation(...axes) {
		const result = axes.last instanceof this ? this.identity(axes.pop()) : new this();
		if (axes[0] instanceof Vector)
			axes = axes[0].values;

		const { size } = this;
		result.set(axes, size * (size - 1));
		return result;
	}
	/**
	 * Creates an identity matrix and optionally stores it in a provided destination.
	 * @param Matrix destination? | The matrix to copy the identity matrix into 
	 * @return Matrix
	 */
	static identity(result = new this()) {
		const { size } = this;
		for (let i = 0; i < size; i++)
		for (let j = 0; j < size; j++)
			result[i * size + j] = +(i === j);
		return result;
	}
	static create() {
		const { size } = this;
		const dst = arguments[size * size] ?? new this();
		for (let i = 0; i < size; i++)
		for (let j = 0; j < size; j++)
			dst[i * size + j] = arguments[j * size + i];
		return dst;
	}
	/**
	 * Multiplies a series of matrices together and optionally stores the result in a provided destination.
	 * @param Matrix3[] matrices | The matrices to multiply together. Order matters for this argument
	 * @param Matrix3 result? | The matrix to copy the result into
	 * @return Matrix3
	 */
	static mulMatrices(matrices, result = new this()) {
		if (matrices.length === 1) return matrices[0].get(result);
		matrices[matrices.length - 2].times(matrices[matrices.length - 1], result);
		for (let i = matrices.length - 3; i >= 0; i--) matrices[i].times(result, result);
		return result;
	}
}

{ // toString
	const methods = ["toString", "toFixed", "toMaxed"];
	for (let i = 0; i < methods.length; i++) {
		const method = methods[i];
		Matrix.prototype[method] = function (arg) {
			const { size } = this.constructor;
			const strs = [...this].map(num => num[method](arg));
			const columns = Array.dim(size)
				.map((_, i) => {
					const start = i * size;
					return strs.slice(start, start + size);
				});
			const widths = columns.map(column => Math.max(...column.map(str => str.length)));
			const contentWidth = Number.sum(widths) + widths.length + 1;
			const spaces = " ".repeat(contentWidth);
			const rows = Array.dim(size)
				.map((_, r) => {
					return `│ ${
						Array.dim(size)
							.map((_, c) => columns[c][r].padStart(widths[c], " "))
							.join(" ")
					} │`;
				})
				.join("\n");
			return `┌${spaces}┐\n${rows}\n└${spaces}┘`;
		};
	}
}

/**
 * Represents a 2 by 2 matrix for use with 2D vectors.
 */
class Matrix2 extends Matrix {
	constructor() {
		super(Matrix2.size, arguments);
	}
	get determinant() {
		return this[0] * this[3] - this[1] * this[2];
	}
	invert() {
		const { determinant } = this;
		if (!determinant) return null;

		const idet = 1 / determinant;
		const a = this[0];
		const d = this[3];
		this[0] = d * idet;
		this[1] *= -idet;
		this[2] *= -idet;
		this[3] = a * idet;

		return this;
	}
	static get Vector() {
		return Vector2;
	}
}
Matrix2.size = 2;

/**
 * Represents a 3 by 3 matrix for use with 2D vectors in homogenous coordinates or 3D vectors in standard coordinates.
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
 */
class Matrix3 extends Matrix {
	constructor() {
		super(Matrix3.size, arguments);
	}
	get determinant() {
		const [
			a, d, g,
			b, e, h,
			c, f, i,
		] = this;

		const co0 = e * i - f * h,
			co1 = d * i - f * g,
			co2 = d * h - e * g;
		
		return a * co0 - b * co1 + c * co2;
	}
	get(dst = new Matrix3()) {
		return super.get(dst);
	}
	invert() {
		const [
			a, d, g,
			b, e, h,
			c, f, i,
		] = this;

		const co0 = e * i - f * h,
			co1 = f * g - d * i,
			co2 = d * h - e * g;
		
		const det = a * co0 + b * co1 + c * co2;
		if (!det) return null;

		const co3 = c * h - b * i,
			co4 = a * i - c * g,
			co5 = b * g - a * h,
			co6 = b * f - c * e,
			co7 = c * d - a * f,
			co8 = a * e - b * d;

		const idet = 1 / det;

		this[0] = co0 * idet;
		this[1] = co1 * idet;
		this[2] = co2 * idet;
		this[3] = co3 * idet;
		this[4] = co4 * idet;
		this[5] = co5 * idet;
		this[6] = co6 * idet;
		this[7] = co7 * idet;
		this[8] = co8 * idet;

		return this;	
	}
	timesVector(vector, dst) {
		if (vector instanceof Vector2) {
			const x = this[0] * vector.x + this[3] * vector.y + this[6];
			const y = this[1] * vector.x + this[4] * vector.y + this[7];
			dst.x = x;
			dst.y = y;
		} else {
			const x = this[0] * vector.x + this[3] * vector.y + this[6] * vector.z;
			const y = this[1] * vector.x + this[4] * vector.y + this[7] * vector.z;
			const z = this[2] * vector.x + this[5] * vector.y + this[8] * vector.z;
			dst.x = x;
			dst.y = y;
			dst.z = z;
		}
	}
	timesMatrix(matrix, dst) {
		const m00 = this[0] * matrix[0] + this[3] * matrix[1] + this[6] * matrix[2];
		const m01 = this[0] * matrix[3] + this[3] * matrix[4] + this[6] * matrix[5];
		const m02 = this[0] * matrix[6] + this[3] * matrix[7] + this[6] * matrix[8];
		const m10 = this[1] * matrix[0] + this[4] * matrix[1] + this[7] * matrix[2];
		const m11 = this[1] * matrix[3] + this[4] * matrix[4] + this[7] * matrix[5];
		const m12 = this[1] * matrix[6] + this[4] * matrix[7] + this[7] * matrix[8];
		const m20 = this[2] * matrix[0] + this[5] * matrix[1] + this[8] * matrix[2];
		const m21 = this[2] * matrix[3] + this[5] * matrix[4] + this[8] * matrix[5];
		const m22 = this[2] * matrix[6] + this[5] * matrix[7] + this[8] * matrix[8];
		Matrix3.create(
			m00, m01, m02,
			m10, m11, m12,
			m20, m21, m22,
			dst
		);
	}
	/**
	 * Converts the matrix to a CSS matrix string.
	 * @return String
	 */
	toCSS() {
		return `matrix(${this[0]}, ${this[1]}, ${this[3]}, ${this[4]}, ${this[6]}, ${this[7]})`;
	}
	/**
	 * Creates a 2D rotation matrix and optionally stores it in a provided destination.
	 * @param Number theta | The clockwise (in screen-space) angle (in radians) to rotate by  
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
	static get Vector() {
		return Vector3;
	}
}
Matrix3.size = 3;

/**
 * Represents a 4 by 4 matrix for use with 3D vectors in homogenous coordinates or 4D vectors in standard coordinates.
 */
class Matrix4 extends Matrix {
	constructor() {
		super(Matrix4.size, arguments);
	}
	get determinant() {
		const [
			a, e, i, m,
			b, f, j, n,
			c, g, k, o,
			d, h, l, p
		] = this;

		const mult0 = k * p,
			mult1 = l * o,
			mult2 = j * p,
			mult3 = l * n,
			mult4 = j * o,
			mult5 = k * n,
			mult6 = i * p,
			mult7 = l * m,
			mult8 = i * o,
			mult9 = k * m,
			mult10 = i * n,
			mult11 = j * m;
		const det0 = mult0 - mult1,
			det1 = mult2 - mult3,
			det2 = mult4 - mult5,
			det3 = mult6 - mult7,
			det4 = mult8 - mult9,
			det5 = mult10 - mult11;
		const co0 = f * det0 - g * det1 + h * det2,
			co1 = e * det0 - g * det3 + h * det4,
			co2 = e * det1 - f * det3 + h * det5,
			co3 = e * det2 - f * det4 + g * det5;
		
		return a * co0 - b * co1 + c * co2 - d * co3;
	}
	get(dst = new Matrix4()) {
		return super.get(dst);
	}
	invert() {
		const [
			a, e, i, m,
			b, f, j, n,
			c, g, k, o,
			d, h, l, p
		] = this;

		const mult0 = k * p,
			mult1 = l * o,
			mult2 = j * p,
			mult3 = l * n,
			mult4 = j * o,
			mult5 = k * n,
			mult6 = i * p,
			mult7 = l * m,
			mult8 = i * o,
			mult9 = k * m,
			mult10 = i * n,
			mult11 = j * m,
			mult12 = g * p,
			mult13 = h * o,
			mult14 = f * p,
			mult15 = h * n,
			mult16 = f * o,
			mult17 = g * n,
			mult18 = e * p,
			mult19 = h * m,
			mult20 = e * o,
			mult21 = g * m,
			mult22 = e * n,
			mult23 = f * m,
			mult24 = g * l,
			mult25 = h * k,
			mult26 = f * l,
			mult27 = h * j,
			mult28 = f * k,
			mult29 = g * j,
			mult30 = e * l,
			mult31 = h * i,
			mult32 = e * k,
			mult33 = g * i,
			mult34 = e * j,
			mult35 = f * i;
		const det0 = mult0 - mult1,
			det1 = mult2 - mult3,
			det2 = mult4 - mult5,
			det3 = mult6 - mult7,
			det4 = mult8 - mult9,
			det5 = mult10 - mult11,
			det6 = mult12 - mult13,
			det7 = mult14 - mult15,
			det8 = mult16 - mult17,
			det9 = mult18 - mult19,
			det10 = mult20 - mult21,
			det11 = mult22 - mult23,
			det12 = mult24 - mult25,
			det13 = mult26 - mult27,
			det14 = mult28 - mult29,
			det15 = mult30 - mult31,
			det16 = mult32 - mult33,
			det17 = mult34 - mult35;
		const co0 = f * det0 - g * det1 + h * det2,
			co1 = e * det0 - g * det3 + h * det4,
			co2 = e * det1 - f * det3 + h * det5,
			co3 = e * det2 - f * det4 + g * det5,
			co4 = b * det0 - c * det1 + d * det2,
			co5 = a * det0 - c * det3 + d * det4,
			co6 = a * det1 - b * det3 + d * det5,
			co7 = a * det2 - b * det4 + c * det5,
			co8 = b * det6 - c * det7 + d * det8,
			co9 = a * det6 - c * det9 + d * det10,
			co10 = a * det7 - b * det9 + d * det11,
			co11 = a * det8 - b * det10 + c * det11,
			co12 = b * det12 - c * det13 + d * det14,
			co13 = a * det12 - c * det15 + d * det16,
			co14 = a * det13 - b * det15 + d * det17,
			co15 = a * det14 - b * det16 + c * det17;
		
		const det = a * co0 - b * co1 + c * co2 - d * co3;
		if (!det) return null;

		const idet = 1 / det;

		this[0] = co0 * idet;
		this[1] = -co1 * idet;
		this[2] = co2 * idet;
		this[3] = -co3 * idet;
		this[4] = -co4 * idet;
		this[5] = co5 * idet;
		this[6] = -co6 * idet;
		this[7] = co7 * idet;
		this[8] = co8 * idet;
		this[9] = -co9 * idet;
		this[10] = co10 * idet;
		this[11] = -co11 * idet;
		this[12] = -co12 * idet;
		this[13] = co13 * idet;
		this[14] = -co14 * idet;
		this[15] = co15 * idet;

		return this;
	}
	static get Vector() {
		return Vector4;
	}
}
Matrix4.size = 4;