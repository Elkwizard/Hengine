load(String.raw`
	(1)Array(/1)
	(p)
		The standard javascript Array class has some new prototype methods and properties in the Hengine.
	(/p)
	(2)Properties(/2)
	(p)
		(prop:last$any$)The last element of the Array.(/prop)
	(/p)
	(2)Methods(/2)
	(p)
		(method:Array.dim@...size@$Array$)
			Returns a multidimensional Array with a dimension of *size.length*, filled with *null*.
			If only one argument is passed, this function is the same as the Array constructor.
			All of the default Array modification methods, *map, forEach, fill* work only on leaf Array elements, 
			where multiple index arguments are passed to accomodate for extra dimensions.
			(2)Parameters(/2)
			(p2)
				(param:size$Number[]$)The dimensions along each axis of the Array.(/param)
			(/p2)
		(/method)
	(/p)
`);