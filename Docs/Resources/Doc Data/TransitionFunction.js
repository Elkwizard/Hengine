load(String.raw`
	(1)(Class)TransitionFunction(/1)
	(p)
		A TransitionFunction is an #IntervalFunction# that is called over the course of a specified time interval with a 0 to 1 parameter for the internal function.
	(/p)
	(2)Type(/2)
	(p)**
	class TransitionFunction extends #IntervalFunction# { ... }
	**(/p)
	(2)Syntax(/2)
	(p)**
	new TransitionFunction(fn, wait, type)
	**(/p)
	(2)Parameters(/2)
	(p)
		(param:function $Function$)The function that will be executed for the specified number of engine frames. This function should take 1 parameter, which will be a number that starts at 0 and linearly changes to 1 over the course of the TransitionFunction's calling interval.(/param)
		(param:wait $Number$)The amount of engine frames that the TransitionFunction should be called over.(/param)
		(param:type $IntervalFunction.Symbol$)The placement during the #IntervalManager#'s update cycle that the function will be executed.(/param)
	(/p)
`);