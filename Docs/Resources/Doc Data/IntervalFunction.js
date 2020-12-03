load(String.raw`
	(1)(Class)IntervalFunction(/1)
	(p)
		The superclass for all functions that can be called repeatedly by an #IntervalManager#.
	(/p)
	(2)Type(/2)
	(p)**
	class IntervalFunction { ... }
	**(/p)
	(2)Subclasses(/2)
	(p)
		#ContinuousFunction#, #DelayedFunction#, #TransitionFunction#, #WaitUntilFunction#.
	(/p)
	(2)Syntax(/2)
	(p)**
	new IntervalFunction(function, duration, type)
	**(/p)
	(2)Parameters(/2)
	(p)
		(param:function $Function$)The function that will be executed over the course of the interval for the IntervalFunction.(/param)
		(param:duration $Number$)The amount of engine frames that the IntervalFunction will be executed over.(/param)
		(param:type $IntervalFunction.Symbol$)The placement during the #IntervalManager#'s update cycle that the function will be executed.(/param)
	(/p)	
	(2)Properties(/2)
	(p)
		(prop:fn $Function$)The function that will be executed over the course of the interval for the IntervalFunction.(/prop)
		(prop:interval $Number$)The amount of engine frames that the IntervalFunction will be executed over.(/prop)
		(prop:type $IntervalFunction.Symbol$)The placement during the #IntervalManager#'s update cycle that the function will be executed.(/prop)
		(prop:IntervalFunction.BEFORE_UPDATE $IntervalFunction.Symbol$)The IntervalFunction is executed before the main update.(/prop)
		(prop:IntervalFunction.UPDATE $IntervalFunction.Symbol$)The IntervalFunction is executed directly before the main update.(/prop)
		(prop:IntervalFunction.AFTER_UPDATE $IntervalFunction.Symbol$)The IntervalFunction is executed after the main update.(/prop)
	(/p)	
`);