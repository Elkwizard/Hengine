load(String.raw`
	(1)(Class)Spline(/1)
	(p)
		A data structure for storing quartic splines with T values from 0 to 1.
	(/p)
	(2)Type(/2)
	(p)**
	class Spline { ... }
	**(/p)
	(2)Syntax(/2)
	(p)**
	new Spline(a, b, c, d)
	**(/p)
	(2)Parameters(/2)
	(p)
		(param:a $Vector2$)The 1st control point of the Spline.(/param)
		(param:b $Vector2$)The 2nd control point of the Spline.(/param)
		(param:c $Vector2$)The 3rd control point of the Spline.(/param)
		(param:d $Vector2$)The 4th control point of the Spline.(/param)
	(/p)
	(2)Properties(/2)
	(p)
		(prop:a $Vector2$)The 1st control point of the Spline.(/prop)
		(prop:b $Vector2$)The 2nd control point of the Spline.(/prop)
		(prop:c $Vector2$)The 3rd control point of the Spline.(/prop)
		(prop:d $Vector2$)The 4th control point of the Spline.(/prop)
	(/p)
	(2)Methods(/2)
	(p)
		(method:evaluate@t@$Vector2$)
			Returns the point on the spline at T=t.
			(2)Parameters(/2)
			(p2)
				(param:t $Number$)The parameter variable for the spline.(/param)
			(/p2)
		(/method)
	(/p)
`);