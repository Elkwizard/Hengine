load(String.raw`
	(1)(Class)Circle(/1)
	(p)
		A data structure for storing an axis aligned circle. All single axis operators (*scaleX*, *scaleY*) will scale evenly on both axes to preserve the equal radii of the Circle.
	(/p)
	(2)Type(/2)
	(p)**
	class Circle extends #Shape# { ... }
	**(/p)
	(2)Syntax(/2)
	(p)**
	new Circle(x, y, radius)
	**(/p)
	(2)Parameters(/2)
	(p)
		(param:x $Number$)The x coordinate of the center of the Circle.(/param)
		(param:y $Number$)The y coordinate of the center of the Circle.(/param)
		(param:radius $Number$)The radius of the Circle.(/param)
	(/p)
	(2)Properties(/2)
	(p)
		(prop:x $Number$)The x coordinate of the center of the Circle.(/prop)
		(prop:y $Number$)The y coordinate of the center of the Circle.(/prop)
		(prop:radius $Number$)The radius of the Circle.(/prop)
	(/p)
`);