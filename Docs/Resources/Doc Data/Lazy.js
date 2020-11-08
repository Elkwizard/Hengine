load(String.raw`
	(1)(Class)Lazy(/1)
	(p)
		A static class for defining delayed \(lazy\) processing properties.
	(/p)
	(2)Methods(/2)
	(p)
		(method:Lazy.define@object, name, value@$void$)
			Creates a read only property on the given object that will only be evaluated when it is referenced the first time. 
			All future times, the getter will return the same value.
			(2)Parameters(/2)
			(p2)
				(param:object $Object$)The object to define the property on.(/param)
				(param:name $String$)The name of the lazy value property to define.(/param)
				(param:value $Function$)A function that returns the value that the lazy value should return.(/param)
			(/p2)
		(/method)
	(/p)
`);