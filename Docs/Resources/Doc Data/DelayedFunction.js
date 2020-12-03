load(String.raw`
	(1)(Class)DelayedFunction(/1)
	(p)
		A DelayedFunction is an #IntervalFunction# that is called after a specified number of engine frames.
	(/p)
	(2)Type(/2)
	(p)**
	class DelayedFunction extends #IntervalFunction# { ... }
	**(/p)
	(2)Syntax(/2)
	(p)**
	new DelayedFunction(fn, wait, type)
	**(/p)
	(2)Parameters(/2)
	(p)
		(param:function $Function$)The function that will be executed after the specified number of engine frames.(/param)
		(param:wait $Number$)The amount of engine frames to wait before executing the function.(/param)
		(param:type $IntervalFunction.Symbol$)The placement during the #IntervalManager#'s update cycle that the function will be executed.(/param)
	(/p)
`);