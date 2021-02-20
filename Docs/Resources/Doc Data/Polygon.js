load(String.raw`
	(1)(Class)Polygon(/1)
	(p)
		A data structure for storing non-intersecting polygons. After constructing the Polygon, the vertices will be re-ordered to be in clockwise order.
	(/p)
	(2)Type(/2)
	(p)**
	class Polygon extends #Shape# { ... }
	**(/p)
	(2)Syntax(/2)
	(p)**
	new Polygon(vertices)
	**(/p)
	(2)Parameters(/2)
	(p)
		(param:vertices $Vector2[]$)The vertices of the polygon.(/param)
	(/p)
	(2)Properties(/2)
	(p)
		(prop:vertices $Vector2[]$readonly)The vertices of the polygon.(/prop)
	(/p)
	(2)Methods(/2)
	(p)
		(method:rotate@angle@$Polygon$)
			Returns a new version of the Polygon that has been rotated by the given angle.
			(2)Parameters(/2)
			(p2)
				(param:angle $Number$)The angle to rotate the Polygon by.(/param)
			(/p2)
		(/method)
		(method:Polygon.regular@sides, radius@$Polygon$)
			Returns a regular Polygon with the given number of sides and a given radius.
			(2)Parameters(/2)
			(p2)
				(param:sides $Number$)The amount of sides of the regular Polygon.(/param)
				(param:radius $Number$)The distance from the center of the Polygon to each of the vertices.(/param)
			(/p2)
		(/method)
	(/p)
`);