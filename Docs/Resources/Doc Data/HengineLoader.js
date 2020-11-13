load(String.raw`
	(1)(Class)HengineLoader(/1)
	(p)
		The HengineLoader is a class that loads and sets up a standard configuration for the #Hengine#. 
		The HengineLoader allows for resources to be loaded in a synchronized way. *.loadResource* is also present on *window*. 
	(/p)
	(2)Type(/2)
	(p)**
	class HengineLoader { ... }
	**(/p)
	(2)Syntax(/2)
	(p)**
	new HengineLoader([wrapper])
	**(/p)
	(2)Parameters(/2)
	(p)
		(param:wrapper $HTMLElement$)The wrapper for the #Hengine# being loaded. Default is *document.body*.(/param)
	(/p)
	(2)Properties(/2)
	(p)
		(prop:hengine $Hengine$)The #Hengine# that was loaded by the HengineLoader. All of the Hengine defined properties of the #Hengine# are also globalized to *window*.(/prop)
	(/p)
	(2)Methods(/2)
	(p)
		(method:loadResource@src@$HImage$)
			Returns an #HengineResource# that the HengineLoader was made aware of in the provided #HengineResource[]#.
			(2)Parameters(/2)
			(p2)
				(param:src $String$)The source of the resource originally used when loading it with *Hengine.load*.(/param)
			(/p2)
		(/method)
		(method:HengineLoader.load@resources@$void$)
			Loads the resources provided.
			(2)Parameters(/2)
			(p2)
				(param:resources $HengineResource[]$)A list of all the #HengineResource#s the project needs.(/param)
			(/p2)
		(/method)
	(/p)
`)