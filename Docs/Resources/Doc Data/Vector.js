load(String.raw`
	(1)(Class)Vector(/1)
	(p)
		Vector is the superclass for all multidimensional mathematical vector and point data structures.
	(/p)
	(2)Type(/2)
	(p)**
	class Vector extends #Operable# { ... }
	**(/p)
	(2)Subclasses(/2)
	(p)
		#Vector2#, #Vector3#, #Vector4#.
	(/p)
	(2)Properties(/2)
	(p)
		(prop:mag $Number$)The magnitude of the Vector.(/prop)
		(prop:sqrMag $Number$)The magnitude of the Vector squared.(/prop)
		(prop:normalized $Vector$)The unit vector with the same direction as the caller.(/prop)
		(prop:inverse $Vector$)The vector in the opposite direction of the caller.(/prop)
	(/p)
	(2)Methods(/2)
	(p)
		(method:invert@@$Vector$)
			Inverts the direction of the Vector.
		(/method)
		(method:normalize@@$Vector$)
			Normalizes the Vector.
		(/method)
		(method:dot@v@$Number$)
			Returns the dot product of the caller and the given Vector.
			(2)Parameters(/2)
			(p2)
				(param:v $Vector$)The vector to take the dot product with.(/param)
			(/p2)
		(/method)
		(method:projectOnto@v@$Vector$)
			Returns the result of projecting the caller onto the given Vector.
			(2)Parameters(/2)
			(p2)
				(param:v $Vector$)The vector to project onto.(/param)
			(/p2)
		(/method)
		(method:Vector.dist@a, b@$Number$)
			Returns the distance between the two given Vectors.
			(2)Parameters(/2)
			(p2)
				(param:a $Vector$) The first point.(/param)
				(param:b $Vector$) The second point.(/param)
			(/p2)
		(/method)
		(method:Vector.sqrDist@a, b@$Number$)
			Returns the distance squared between the two given Vectors.
			(2)Parameters(/2)
			(p2)
				(param:a $Vector$) The first point.(/param)
				(param:b $Vector$) The second point.(/param)
			(/p2)
		(/method)
	(/p)
`);