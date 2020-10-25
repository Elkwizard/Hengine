load(String.raw`
	(1)(Class)Graph(/1)
	(p)
		A Graph is a data structure for storing varying data over time.
		Graphs can be visualized by drawing them on #GraphPlane#s.
	(/p)
	(2)Type(/2)
	(p)**
	class Graph { ... }
	**(/p)
	(2)Syntax(/2)
	(p)**
	new Graph(yName, getYValue, minY, maxY, color[, decimalPlaces])
	**(/p)
	(2)Parameters(/2)
	(p)
		(param:yName $String$)The name of the variable being graphed. \(Not the name of an actual variable, just a name to be drawn.\)(/param)
		(param:getYValue $Function$)A function of time that returns a Number. This function will be called when the time in question occurs. This function does not have to be pure. This function determines the y value of the Graph.(/param)
		(param:minY $Number$)The minumum value of *getYValue* that will be graphed.(/param)
		(param:maxY $Number$)The maximum value of *getYValue* that will be graphed.(/param)
		(param:color $Color$)The #Color# of the line used to draw the Graph on a #GraphPlane#.(/param)
		(param:decimalPlaces $Number$)The maximum amount of decimal places allowed on the Graph's output. Default is 2.(/param)
	(/p)
	(2)Properties(/2)
	(p)
		(prop:name $String$)The name of the variable being graphed.(/prop)	
		(prop:y $Function$readonly)A function of time that returns a Number. This function will be called when the time in question occurs. This function does not have to be pure. This function determines the y value of the Graph.(/prop)
		(prop:minY $Number$)The minumum value of *getYValue* that will be graphed.(/prop)
		(prop:maxY $Number$)The maximum value of *getYValue* that will be graphed.(/prop)
		(prop:color $Color$)The #Color# of the line used to draw the Graph on a #GraphPlane#.(/prop)
		(prop:decimalPlaces $Number$)The maximum amount of decimal places allowed on the Graph's output.(/prop)
		(prop:plane $GraphPlane$)The #GraphPlane# that the Graph is visualized on. This property starts at *null*, and is initialized when the Graph is attached to a #GraphPlane#.(/prop)
	(/p)
`);