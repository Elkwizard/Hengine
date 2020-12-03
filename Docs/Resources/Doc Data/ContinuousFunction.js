load(String.raw`
	(1)(Class)ContinuousFunction(/1)
	(p)
		A ContinuousFunction is an #IntervalFunction# that is called every update cycle eternally.
	(/p)
	(2)Type(/2)
	(p)**
	class ContinuousFunction extends #IntervalFunction# { ... }
	**(/p)
	(2)Syntax(/2)
	(p)**
	new ContinuousFunction(fn, type)
	**(/p)
	(2)Parameters(/2)
	(p)
		(param:function $Function$)The function that will be executed over the course of the interval for the ContinuousFunction. This function takes one parameter which will be the amount of frames since the function was first called.(/param)
		(param:type $IntervalFunction.Symbol$)The placement during the #IntervalManager#'s update cycle that the function will be executed.(/param)
	(/p)
`);