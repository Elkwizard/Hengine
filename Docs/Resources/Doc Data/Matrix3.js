load(String.raw`
	(1)(Class)Matrix3(/1)
	(p)
		Matrix3 is a class for manipulating and storing 3 by 3 matrices stored as column major 1D arrays.
	(/p)
	(2)Type(/2)
	(p)**
	class Matrix3 extends Float64Array { ... }
	**(/p)
	(2)Syntax(/2)
	(p)**
	new Matrix3(
		m00, m01, m02,
		m10, m11, m12,
		m20, m21, m22
	)
	**(/p)
	(2)Parameters(/2)
	(p)
		(param:m[R][C] $Number$)The value at the position in the matrix specified by R rows and C columns. Example: *m01* for row 0 column 1.(/param)
	(/p)
	(2)Properties(/2)
	(p)
		(param:m[R][C] $Number$)The value at the position in the matrix specified by R rows and C columns.(/param)
	(/p)
	(2)Methods(/2)
	(p)
		(method:mul@matrix@$Matrix3$)
			Multiplies the caller and a given matrix, and stores the result in the caller. Returns the caller.
			(2)Parameters(/2)
			(p2)
				(param:matrix $Matrix3$)The matrix to multiply by.(/param)
			(/p2)
		(/method)
		(method:times@b[, result]@$any$)
			Returns the product of the caller and a given matrix or vector.
			(2)Parameters(/2)
			(p2)
				(param:b $any$)The Matrix3 or #Vector2# to multiply by.(/param)
				(param:result $Matrix3$)An optional matrix for the result to be written to. Default is a new Matrix3.(/param)
			(/p2)
		(/method)
		(method:get@[result]@$Matrix3$)
			Returns a copy of the matrix.
			(2)Parameters(/2)
			(p2)
				(param:result $Matrix3$)An optional matrix for the result to be written to. Default is a new Matrix3.(/param)
			(/p2)
		(/method)
		(method:Matrix3.identity@[result]@$Matrix3$)
			Returns an identity matrix.
			(2)Parameters(/2)
			(p2)
				(param:result $Matrix3$)An optional matrix for the result to be written to. Default is a new Matrix3.(/param)
			(/p2)
		(/method)
		(method:Matrix3.translation@x, y[, result]@$Matrix3$)
			Returns a matrix that translates along the x and y axes by the provided offsets.
			(2)Parameters(/2)
			(p2)
				(param:x $Number$)The translation on the x axis.(/param)
				(param:y $Number$)The translation on the y axis.(/param)
				(param:result $Matrix3$)An optional matrix for the result to be written to. Default is a new Matrix3.(/param)
			(/p2)
		(/method)
		(method:Matrix3.rotation@theta[, result]@$Matrix3$)
			Returns a matrix that rotates counter-clockwise by the provided angle.
			(2)Parameters(/2)
			(p2)
				(param:theta $Number$)The angle to rotate by.(/param)
				(param:result $Matrix3$)An optional matrix for the result to be written to. Default is a new Matrix3.(/param)
			(/p2)
		(/method)
		(method:Matrix3.scale@x, y[, result]@$Matrix3$)
			Returns a matrix that scales along the x and y axes by the provided amounts.
			(2)Parameters(/2)
			(p2)
				(param:x $Number$)The scale factor along the x axis.(/param)
				(param:y $Number$)The scale factor along the y axis.(/param)
				(param:result $Matrix3$)An optional matrix for the result to be written to. Default is a new Matrix3.(/param)
			(/p2)
		(/method)
		(method:Matrix3.mulMatrices@matrices[, result]@$Matrix3$)
			Returns the composition of all the provided matrices.
			(2)Parameters(/2)
			(p2)
				(param:matrices $Matrix3[]$)The list of matrices to composite.(/param)
				(param:result $Matrix3$)An optional matrix for the result to be written to. Default is a new Matrix3.(/param)
			(/p2)
		(/method)
	(/p)
`);