load(String.raw`
	(1)(Class)HengineAnimationResource(/1)
	(p)
		A data structure to represent an #Animation# resource that will be loaded by #HengineLoader#.
	(/p)
	(2)Type(/2)
	(p)**
	class HengineAnimationResource extends HengineResource { ... }
	**(/p)
	(2)Syntax(/2)
	(p)**
	new HengineAnimationResource(src, frames, delay, loops)
	**(/p)
	(2)Parameters(/2)
	(p)
		(param:src $String$)The path to the animation folder being loaded.(/param)
		(param:frames $Number$)The amount of frames in the animation.(/param)
		(param:delay $Number$)The frame delay for the animation.(/param)
		(param:loops $Boolean$)Whether or not the animation loops.(/param)
	(/p)
	(2)Properties(/2)
	(p)
		(prop:frames $Number$)The amount of frames in the animation.(/prop)
		(prop:delay $Number$)The frame delay for the animation.(/prop)
		(prop:loops $Boolean$)Whether or not the animation loops.(/prop)
	(/p)
`);