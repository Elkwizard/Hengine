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
		if (args.length === this.length) {
			for (let i = 0; i < size; i++)
				for (let j = 0; j < size; j++)
					this[i * size + j] = args[j * size + i];
		} else if (args.length > 1) {
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
	 * Returns the maximum length ratio (`this.times(v).mag / v.mag`) that is possible for a Vector `v` of the same dimension as the caller.
	 * @return Number
	 */
	get maxScaleFactor() {
		const { size } = this.constructor;
		let max = 0;
		for (let c = 0; c < size; c++) {
			let sqrMag = 0;
			for (let r = 0; r < size; r++)
				sqrMag += this[c * size + r] ** 2;
			if (sqrMag > max) max = sqrMag;
		}
		return Math.sqrt(max);
	}
	/**
	 * Returns the maximum length ratio (`this.times(v).mag / v.mag`) that is possible for a Vector `v` of one less dimension than the caller.
	 * @return Number
	 */
	get maxHomogenousScaleFactor() {
		const { size } = this.constructor;
		let max = 0;
		const hSize = size - 1;
		for (let c = 0; c < hSize; c++) {
			let sqrMag = 0;
			for (let r = 0; r < size; r++)
				sqrMag += this[c * size + r] ** 2;
			if (sqrMag > max) max = sqrMag;
		}
		return Math.sqrt(max);
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
	 * @name get determinant
	 * Returns the determinant of the caller.
	 * @return Number
	 */
	get stretch() {
		return Math.abs(this.determinant) ** (1 / this.constructor.size);
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
		const { size } = this.constructor;
		for (let i = 0; i < size; i++) {
			for (let j = i + 1; j < size; j++) {
				const a = i * size + j;
				const b = j * size + i;
				const temp = this[a];
				this[a] = this[b];
				this[b] = temp;
			}
		}
		return this;
	}
	/**
	 * @name invert
	 * If the caller is invertible, this inverts the caller in-place and returns it, otherwise returns null.
	 * @return Matrix/null
	 */
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
	op(other, op, dst = this.get()) {
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
	/**
	 * Projects a vector of dimension N - 1 by extending it with an additional 1, and dividing by the resulting final component.
	 * @param Vector vector | The vector to project
	 * @param Vector result? | The destination to store the resulting vector in. If not specified, a new vector will be created 
	 * @return Vector
	 */
	project(vector, dst = vector.constructor.zero) {
		const { Vector } = this.constructor;
		const h = new Vector().set(vector, 1);
		this.times(h, h);
		dst.set(h).div(h[h.constructor.modValues.last]);
		return dst;
	}
	timesVector(vector, dst) {
		const { size } = this.constructor;
		const { modValues } = vector.constructor;
		const result = vector.constructor.zero;
		for (let i = 0; i < modValues.length; i++) {
			let sum = 0;
			for (let j = 0; j < size; j++)
				sum += (vector[modValues[j]] ?? 1) * this[j * size + i];
			result[modValues[i]] = sum;
		}
		
		dst.set(result);
	}
	timesMatrix(matrix, dst) {
		const { size, temp } = this.constructor;
		for (let c = 0; c < size; c++)
		for (let r = 0; r < size; r++) {
			let sum = 0;
			for (let k = 0; k < size; k++)
				sum += this[k * size + r] * matrix[c * size + k];
			temp[c * size + r] = sum;
		}
		dst.set(temp);
	}
	/**
	 * Computes the product of the caller and another object and returns the result.
	 * @param Matrix/Vector/Number other | The right-hand side of the product. If this is a vector of dimension N - 1, it will be converted to and from homogenous coordinates to facilitate the multiplication 
	 * @param Matrix/Vector result? | A destination to optionally store the result in. If not specified, the result will be a new vector or matrix
	 * @return Matrix/Vector/Number
	 */
	times(other, dst) {
		if (other instanceof Vector) {
			dst ??= other.constructor.zero;
			this.timesVector(other, dst);
		} else {
			dst ??= this.get();
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
	 * Creates an N - 1 dimensional homogenous scaling matrix about a given point and optionally stores it in a provided destination.
	 * @param Vector/Number scale | The scale factor along every axis. If this is a number, the matrix will scale uniformly on all axes
	 * @param Vector center | The center to scale about
	 * @param Matrix result? | The matrix to copy the scaling matrix into 
	 * @return Matrix
	 */
	static scaleAbout(scale, center, result = new this()) {
		const translation = this.translation(center.minus(center.times(scale)), result);
		const scaling = this.scale(scale);
		return translation.times(scaling, result);
	}
	/**
	 * Creates an N - 1 dimensional homogenous scaling matrix and optionally stores it in a provided destination.
	 * @signature
	 * @param Number scale | The scale factor along every axis
	 * @param Matrix result? | The matrix to copy the scaling matrix into
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

		const { size } = this;
		const count = size - 1;

		const first = axes[0];
		if (axes.length === 1) {
			if (typeof first === "number")
				axes = new Array(count).fill(first);
			else if (first instanceof Vector)
				axes = first.values;
		}

		for (let i = 0; i < count; i++)
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
	static create(...args) {
		const { size } = this;
		const dst = args[size * size] ?? new this();
		for (let i = 0; i < size; i++)
		for (let j = 0; j < size; j++)
			dst[i * size + j] = args[j * size + i];
		return dst;
	}
	/**
	 * Multiplies a series of matrices together and optionally stores the result in a provided destination.
	 * @param Matrix[] matrices | The matrices to multiply together. Order matters for this argument
	 * @param Matrix result? | The matrix to copy the result into
	 * @return Matrix
	 */
	static mul(matrices, result = new this()) {
		result.set(matrices[0]);
		for (let i = 1; i < matrices.length; i++)
			result.mul(matrices[i]);
		return result;
	}
	static mulMatrices(matrices, result) {
		return this.mul(matrices, result);
	}
	static get Vector() {
		return Vector[this.size];
	}
	static get TransformVector() {
		return Vector[this.size - 1];
	}
	static get temp() {
		return this._temp ??= new Float64Array(this.size * this.size);
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
	static size = 2;
	constructor(...args) {
		super(Matrix2.size, args);
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
}

/**
 * Represents a 3 by 3 matrix for use with 2D vectors in homogenous coordinates or 3D vectors in standard coordinates.
 * ```js
 * const transformation = Matrix3.mul([
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
	static size = 3;
	constructor(...args) {
		super(Matrix3.size, args);
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
	get(dst = null) {
		return dst ? super.get(dst) : new Matrix3(this);
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
		if (vector.constructor === Vector2) {
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
	toPhysicsMatrix(result = new Physics.MatrixRC_3_()) {
		for (let r = 0; r < 3; r++)
		for (let c = 0; c < 3; c++)
			result.set(r, c, this[c * 3 + r]);
		return result;
	}
	static fromPhysicsMatrix(matrix) {
		const result = new Matrix3();
		for (let r = 0; r < 3; r++)
		for (let c = 0; c < 3; c++)
			result[c * 3 + r] = matrix.get(r, c);
		return result;
	}
	static normal(matrix, dst = new Matrix3()) {
		const { size } = matrix.constructor;
		for (let r = 0; r < 3; r++)
		for (let c = 0; c < 3; c++)
			dst[c * 3 + r] = matrix[c * size + r];
		return dst.invert()?.transpose?.() ?? Matrix3.identity(dst);
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
}

/**
 * Represents a 4 by 4 matrix for use with 3D vectors in homogenous coordinates or 4D vectors in standard coordinates.
 */
class Matrix4 extends Matrix {
	static size = 4;
	constructor(...args) {
		super(Matrix4.size, args);
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
	get(dst = null) {
		return dst ? super.get(dst) : new Matrix4(this);
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
	timesVector(vector, dst) {
		if (vector.constructor === Vector3) {
			intervals.count("timesVector3");
			const x = this[0] * vector.x + this[4] * vector.y + this[8] * vector.z + this[12];
			const y = this[1] * vector.x + this[5] * vector.y + this[9] * vector.z + this[13];
			const z = this[2] * vector.x + this[6] * vector.y + this[10] * vector.z + this[14];
			dst.x = x;
			dst.y = y;
			dst.z = z;
		} else {
			const x = this[0] * vector.x + this[4] * vector.y + this[8] * vector.z + this[12] * vector.w;
			const y = this[1] * vector.x + this[5] * vector.y + this[9] * vector.z + this[13] * vector.w;
			const z = this[2] * vector.x + this[6] * vector.y + this[10] * vector.z + this[14] * vector.w;
			const w = this[3] * vector.x + this[7] * vector.y + this[11] * vector.z + this[15] * vector.w;
			dst.x = x;
			dst.y = y;
			dst.z = z;
			dst.w = w;
		}
	}
	column(index) {
		const base = index * 4;
		return new Vector4(
			this[base + 0],
			this[base + 1],
			this[base + 2],
			this[base + 3]
		);
	}
	/**
	 * Creates a counter-clockwise rotation matrix about a specified axis by a specified angle and optionally stores it in a provided destination.
	 * @param Vector3 angle | The rotation. The direction of this vector is the axis of rotation, and the magnitude is the angle
	 * @param Matrix4 result? | The destination to store the resulting matrix in. If not specified, a new matrix will be created
	 */
	static rotation(angle, dst = new Matrix4()) {
		return new Matrix4(Quaternion.fromRotation(angle).toMatrix()).get(dst);
	}
	/**
	 * Creates a perspective projection matrix for use in 3D rendering.
	 * @param Number aspectRatio | The aspect ratio of the surface on which the rendering will occur (`height / width`)
	 * @param Number fov | The angular size of the field of view in radians
	 * @param Number zNear | The near clipping plane
	 * @param Number zFar | The far clipping plane
	 * @param Matrix4 result? | The destination to store the resulting matrix in. If not specified, a new matrix will be created
	 * @return Matrix4
	 */
	static perspective(ar, fov, zn, zf, result) {
		const zr = zf - zn;
		const f = 1 / Math.tan(fov / 2);
		return Matrix4.create(
			ar * f, 0,	0,				0,
			0,		f,	0,				0,
			0,		0,	(zf + zn) / zr,	-2 * zf * zn / zr,
			0,		0,	1,				0,
			result
		);
	}
	/**
	 * Creates an orthographic projection matrix for use in 3D rendering.
	 * The x and y range parameters can be specified as numbers to indicate the size of a 0-centered range (e.g. `6` corresponds to `new Range(-3, 3)`).
	 * @signature
	 * @param Range/Number xRange | The range along the x axis of view space to include in the projection
	 * @param Range/Number yRange | The range along the y axis of view space to include in the projection
	 * @param Range/Number zRange | The range along the z axis of view space to include in the projection. If this is specified as a number, it represents a range from 0 to the argument (e.g. `6` corresponds to `new Range(0, 6)`)
	 * @param Matrix4 result? | The destination to store the resulting matrix in. If not specified, a new matrix will be created
	 * @signature
	 * @param Prism bounds | The range to include in the projection
	 * @param Matrix4 result? | The destination to store the resulting matrix in. If not specified, a new matrix will be created
	 * @return Matrix4
	 */
	static orthographic(xRange, yRange, zRange, result) {
		if (xRange instanceof Prism)
			({ xRange, yRange, zRange } = xRange);
		
		if (typeof xRange === "number") xRange = new Range(-xRange / 2, xRange / 2);
		if (typeof yRange === "number") yRange = new Range(-yRange / 2, yRange / 2);
		if (typeof zRange === "number") zRange = new Range(0, zRange);
		const xScale = 2 / xRange.length;
		const yScale = 2 / yRange.length;
		const zScale = 2 / zRange.length;
		return Matrix4.create(
			xScale,	0,		0,		-xScale * xRange.min - 1,
			0,		yScale,	0,		-yScale * yRange.min - 1,
			0,		0,		zScale,	-zScale * zRange.min - 1,
			0,		0,		0,		1,
			result
		);
	}
}

Matrix.sizes = [,, Matrix2, Matrix3, Matrix4];
ND.Matrix = Matrix[DIM];
ND.TransformMatrix = Matrix[DIM + 1];