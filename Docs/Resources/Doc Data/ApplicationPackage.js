load(String.raw`
	(1)(Class)ApplicationPackage(/1)
	(p)
		An ApplicationPackage is a data structure for storing where resources to be loaded by a #HengineLoader# are located.
	(/p)
	(2)Type(/2)
	(p)**
	class ApplicationPackage { ... }
	**(/p)
	(2)Syntax(/2)
	(p)**
	new ApplicationPackage([engine, code, sprites, animations, sound])
	**(/p)
	(2)Parameters(/2)
	(p)
		(param:engine $ApplicationPackageElement$)The #ApplicationPackageElement# that contains the loading information for the Hengine scripts. This has to be *#HengineLoader#.defaultEnginePackage*.(/param)
		(param:code $ApplicationPackageElement$)The #ApplicationPackageElement# that stores where the code should be sourced from. The files are in the format of just the name of the js files.(/param)
		(param:sprites $ApplicationPackageElement$)The #ApplicationPackageElement# that stores where the sprites should be sourced from. The files are in the format of the image name, and the extension.(/param)
		(param:animations $ApplicationPackageElement$)The #ApplicationPackageElement# that stores where the animations should be sourced from. The files are in the format *{ folder, frames, loop, delay }*.(/param)
	(/p)
`);