load(String.raw`
	(1)(Class)GraphPlane(/1)
	(p)
		A GraphPlane is a data structure for storing the visualization of #Graph#s over time. 
		A GraphPlane can have any number of #Graph#s displayed on it. 
		GraphPlanes should not be constructed with *new*. 
		They should be created with *#Engine#.prototype.makeGraphPlane*.
	(/p)
	(2)Type(/2)
	(p)**
	class GraphPlane extends #Frame# { ... }
	**(/p)
	(2)Syntax(/2)
	(p)**
	new GraphPlane(graphs, frameLimit)
	**(/p)
	(2)Parameters(/2)
	(param:graphs $Graph[]$)A list of #Graph#s to be displayed on the GraphPlane.(/param)
	(param:frameLimit $Number$)The span of the time axis of the GraphPlane, in engine frames.(/param)
	(2)Properties(/2)
	(p)
		(prop:font $Font$)The #Font# used for displaying times and values on the GraphPlane.(/prop)
		(prop:graphs $Graph[]$readonly)A list of the #Graph#s displayed on the GraphPlane.(/prop)
		(prop:minFrame $Number$)The lowest time, in engine frames, shown on the GraphPlane. This is the value at the minumum of the time axis.(/prop)
		(prop:frameLimit $Number$)The span of the time axis of the GraphPlane, in engine frames.(/prop)
	(/p)
`);