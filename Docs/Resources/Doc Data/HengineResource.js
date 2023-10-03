load(String.raw`
	(1)(Class)HengineResource(/1)
	(p)
		A data structure to represent a resource that will be loaded by #HengineLoader#. HengineResource cannot be constructed.
	(/p)
	(2)Type(/2)
	(p)**
	class HengineResource { ... }
	**(/p)
	(2)Subclasses(/2)
	(p)
		#HengineScriptResource#, #HengineImageResource#, #HengineAnimationResource#, #HengineSoundResource#, #HengineFontResource#.
	(/p)
	(2)Syntax(/2)
	(p)**
	new HengineResource(src)
	**(/p)
	(2)Parameters(/2)
	(p)
		(param:src $String$)The path to the resource being loaded.(/param)
	(/p)
	(2)Properties(/2)
	(p)
		(prop:src $String$)The path to the resource to be loaded.(/prop)
	(/p)
	(2)Methods(/2)
	(p)
		(method:load@@ $Promise$)Begins the loading of the resource and returns a promise that will resolve when the resource is done loading.(/method)
	(/p)
`);