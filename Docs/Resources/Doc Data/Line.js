load(String.raw`
	(1)(Class)Line(/1)
	(p)
		A data structure for storing line segments.
	(/p)
	(2)Type(/2)
	(p)**
	class Line { ... }
	**(/p)
	(2)Syntax(/2)
	(p)**
	new Line(x, y, x1, y1)
	new Line(start, end)
	**(/p)
	(2)Parameters(/2)
	(p)
		(param:x $Number$)The x coordinate of the start of the Line.(/param)
		(param:y $Number$)The y coordinate of the start of the Line.(/param)
		(param:x1 $Number$)The x coordinate of the end of the Line.(/param)
		(param:y1 $Number$)The y coordinate of the end of the Line.(/param)
		(param:start $Vector2$)The start of the Line.(/param)
		(param:end $Vector2$)The end of the Line.(/param)
	(/p)
	(2)Properties(/2)
	(p)
		(prop:a $Vector2$)The start of the Line.(/prop)
		(prop:b $Vector2$)The end of the Line.(/prop)
		(prop:length $Number$readonly)The length of the Line.(/prop)
		(prop:middle $Vector2$readonly)The midpoint of the Line.(/prop)
		(prop:vector $Vector2$readonly)The vector direction from a to b.(/prop)
		(prop:slope $Number$readonly)The slope of the Line.(/prop)
	(/p)
	(2)Methods(/2)
	(p)
		(method:evaluate@x@$Number$)
			Returns the y coordinate on the Line given an x coordinate.
			(2)Parameters(/2)
			(p2)
				(param:x $Number$)The x coordinate to evaluate the Line at.(/param)
			(/p2)
		(/method)
	(/p)
`);