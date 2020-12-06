load(String.raw`
	(1)(Class)Matrix3(/1)
	(p)
		Matrix3 is a class for manipulating 3 by 3 matrices stored as column major 1D arrays. This is a static class.
	(/p)
	(2)Methods(/2)
	(p)
		(method:Matrix3.identity@@$Number[]$)
			Returns an identity matrix.
		(/method)
		(method:Matrix3.translation@x, y@$Number[]$)
			Returns a matrix that translates along the x and y axes by the provided offsets.
			(2)Parameters(/2)
			(p2)
				(param:x $Number$)The translation on the x axis.(/param)
				(param:y $Number$)The translation on the y axis.(/param)
			(/p2)
		(/method)
		(method:Matrix3.rotation@theta@$Number[]$)
			Returns a matrix that rotates counter-clockwise by the provided angle.
			(2)Parameters(/2)
			(p2)
				(param:theta $Number$)The angle to rotate by.(/param)
			(/p2)
		(/method)
		(method:Matrix3.scale@x, y@$Number[]$)
			Returns a matrix that scales along the x and y axes by the provided amounts.
			(2)Parameters(/2)
			(p2)
				(param:x $Number$)The scale factor along the x axis.(/param)
				(param:y $Number$)The scale factor along the y axis.(/param)
			(/p2)
		(/method)
		(method:Matrix3.mulPoint@matrix, point@$Vector2$)
			Performs a matrix multiplication with the given point (with a z value of 1).
			(2)Parameters(/2)
			(p2)
				(param:matrix $Number[]$)The matrix to transform the point with.(/param)
				(param:point $Vector2$)The point to be transformed.(/param)
			(/p2)
		(/method)
		(method:Matrix3.mulMatrix@matrix, matrix2@$Number[]$)
			Performs a matrix multiplication with the given matrices.
			(2)Parameters(/2)
			(p2)
				(param:matrix $Number[]$)The left matrix in the operation.(/param)
				(param:matrix2 $Number[]$)The right matrix in the operation.(/param)
			(/p2)
		(/method)
		(method:Matrix3.mulMatrices@matrices@$Number[]$)
			Returns the composition of all the provided matrices.
			(2)Parameters(/2)
			(p2)
				(param:matrices $Number[][]$)The list of matrices to composite.(/param)
			(/p2)
		(/method)
		(method:Matrix3.copy@matrix@$Number[]$)
			Returns a copy of the given matrix.
			(2)Parameters(/2)
			(p2)
				(param:matrix $Number[]$)The matrix to copy.(/param)
			(/p2)
		(/method)
	(/p)
`);