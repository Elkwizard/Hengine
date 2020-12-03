load(String.raw`
	(1)(Class)WaitUntilFunction(/1)
	(p)
		A WaitUntilFunction is an #IntervalFunction# that is called once when the condition is satisfied.
	(/p)
	(2)Type(/2)
	(p)**
	class WaitUntilFunction extends #IntervalFunction# { ... }
	**(/p)
	(2)Syntax(/2)
	(p)**
	new WaitUntilFunction(fn, event, type)
	**(/p)
	(2)Parameters(/2)
	(p)
		(param:function $Function$)The Function that should be called when the event occurs.(/param)
		(param:event $Function$)A Function that returns a boolean indicating whether or not the event has occurred.(/param)
		(param:type $IntervalFunction.Symbol$)The placement during the #IntervalManager#'s update cycle that the function will be executed.(/param)
	(/p)
`);