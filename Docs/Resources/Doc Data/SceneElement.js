load(String.raw`
	(1)(Class)SceneElement(/1)
	(p)
		The superclass for things which can be in a #Scene#.
	(/p)
	(2)Type(/2)
	(p)**
	class SceneElement { ... }
	**(/p)
	(2)Subclasses(/2)
	(p)
		#SceneObject#, #ElementContainer#.
	(/p)
	(2)Syntax(/2)
	(p)**
	new SceneElement(name, container)
	**(/p)
	(2)Parameters(/2)
	(p)
		(param:name $String$)The name of the SceneElement.(/param)
		(param:container $ElementContainer$)The #ElementContainer# that the SceneElement is within.(/param)
	(/p)
	(2)Properties(/2)
	(p)
		(prop:name $String$)The name of the SceneElement.(/prop)
		(prop:container $ElementContainer$)The #ElementContainer# that the SceneElement is within.(/prop)
		(prop:removed $Boolean$)Whether or not the SceneElement has removed from its container.(/prop)
	(/p)
	(2)Methods(/2)
	(p)
		(method:remove@@$void$)
			Removes the SceneElement from its container.
		(/method)
	(/p)
`);