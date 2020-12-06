load(String.raw`
	(1)(Class)HengineVideoResource(/1)
	(p)
		A data structure to represent an #VideoView# resource that will be loaded by #HengineLoader#.
	(/p)
	(2)Type(/2)
	(p)**
	class HengineVideoResource extends HengineResource { ... }
	**(/p)
	(2)Syntax(/2)
	(p)**
	new HengineVideoResource(src, loops)
	**(/p)
	(2)Parameters(/2)
	(p)
		(param:src $String$)The path to the video being loaded.(/param)
		(param:loops $Boolean$)Whether or not the video loops.(/param)
	(/p)
	(2)Properties(/2)
	(p)
		(prop:loops $Boolean$)Whether or not the video loops.(/prop)
	(/p)
`);