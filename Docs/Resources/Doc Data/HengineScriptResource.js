load(String.raw`
	(1)(Class)HengineScriptResource(/1)
	(p)
		A data structure to represent an script resource that will be loaded by #HengineLoader#.
	(/p)
	(2)Type(/2)
	(p)**
	class HengineScriptResource extends #HengineResource# { ... }
	**(/p)
	(2)Syntax(/2)
	(p)**
	new HengineScriptResource(src)
	**(/p)
	(2)Parameters(/2)
	(p)
		(param:src $String$)The path to the .js file being loaded.(/param)
	(/p)
`);