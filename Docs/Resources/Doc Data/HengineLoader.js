load(String.raw`
	(1)(Class)HengineLoader(/1)
	(p)
		The HengineLoader is a class that loads and sets up a standard configuration for the #Hengine#. 
		The HengineLoader allows for resources to be loaded in a synchronized way. *.loadImage* and *.loadAnimation* are also present on *window*. 
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
		(prop:HengineLoader.defaultEnginePackage $ApplicationPackageElement$)Returns the #ApplicationPackageElement# that contains the loading information for The Hengine.(/prop)
	(/p)
	(2)Methods(/2)
	(p)
		(method:loadImage@src@$HImage$)
			Returns an image resource that the HengineLoader was made aware of in the #ApplicationPackage#.
			(2)Parameters(/2)
			(p2)
				(param:src $String$)The source of the image originally used when loading it with *Hengine.load*.(/param)
			(/p2)
		(/method)
		(method:loadAnimation@folder@$Animation$)
			Returns an animation resource that the HengineLoader was made aware of in the #ApplicationPackage#.
			(2)Parameters(/2)
			(p2)
				(param:folder $String$)The source of the animation originally used when loading it with *Hengine.load*.(/param)
			(/p2)
		(/method)
		(method:HengineLoader.load@app@$void$)
			Loads the resources, scripts, and engine from the provided #ApplicationPackage#.
			(2)Parameters(/2)
			(p2)
				(param:app $ApplicationPackage$)The #ApplicationPackage# to find the format of file structure being loaded from.(/param)
			(/p2)
		(/method)
	(/p)
`)