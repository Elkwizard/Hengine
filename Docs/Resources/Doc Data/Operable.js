load(String.raw`
	(1)(Class)Operable(/1)
	(p)
		Operable is the superclass for objects which can be modified by element-wise operations on a list of numeric values that fully describe their state.
		Do not construct Operables.
	(/p)
	(2)Type(/2)
	(p)**
	class Operable { ... }
	**(/p)
	(2)Subclasses(/2)
	(p)
		#Vector#, #Color#.
	(/p)
	(2)Properties(/2)
	(p)
		(prop:Operable.empty $Operable$readonly)Returns a new instance of the Operable which is initialized to all zeros.(/prop)
		(prop:Operable.modValues $String[]$readonly)The list of names of the numeric fields that make up the Operable. A property exists on all instances of the Operable for each field.(/prop)
	(/p)
	(2)Methods(/2)
	(p)
		All one-dimensional methods of Math (floor, sqrt, log, etc.) are supported as static methods of Operable and operate element-wise on their single Operable arguments.
		These methods do not modify the argument.
		There are also immutable versions of the arithmetic methods (add, sub, mul, div) that return the result as either a new Operable or the optional second argument (an Operable) with the result copied into its fields.
	
	(/p)
	(p)
		(method:set@...values | other@$Operable$)
			If a list of values is provided, the fields of the caller are set to the provided numbers.
			If an Operable is provided, the fields of the caller are set to the fields of the argument.
			Returns the caller.
			(2)Parameters(/2)
			(p2)
				(param:values $Number[]$)The new values for the fields of the caller.(/param)
				(param:other $Operable$)The Operable to copy the values from.(/param)
			(/p2)
		(/method)
		(method:get@[result]@$Operable$)
			If an argument is provided, the values of the caller are copied into the argument and then the argument is returned.
			Otherwise, the values of the caller are copied into a new Operable and the copy is returned.
			(2)Parameters(/2)
			(p2)
				(param:result $Operable$)The Operable to copy the values into.(/param)
			(/p2)
		(/method)
		(method:add@other | number@$Operable$)
			If the argument is an Operable, each field will be added to the fields of the caller element-wise.
			If the argument is a number, each field of the caller will be increased by the argument.
			Returns the caller.
			(2)Parameters(/2)
			(p2)
				(param:other $Operable$)The Operable to be added to the caller.(/param)
				(param:number $Number$)The number to added to each of the fields of the caller.(/param)
			(/p2)
		(/method)
		(method:sub@other | number@$Operable$)
			If the argument is an Operable, each field will be subtracted from the fields of the caller element-wise.
			If the argument is a number, each field of the caller will be decreased by the argument.
			Returns the caller.
			(2)Parameters(/2)
			(p2)
				(param:other $Operable$)The Operable to decrease the caller by.(/param)
				(param:number $Number$)The number to subtracted from each of the fields of the caller.(/param)
			(/p2)
		(/method)
		(method:mul@other | number@$Operable$)
			If the argument is an Operable, each field of the caller is multiplied by the same field in the argument.
			If the argument is a number, each field of the caller will be multiplied by the argument.
			Returns the caller.
			(2)Parameters(/2)
			(p2)
				(param:other $Operable$)The Operable to multiply the caller by.(/param)
				(param:number $Number$)The number to multiply each of the fields of the caller by.(/param)
			(/p2)
		(/method)
		(method:div@other | number@$Operable$)
			If the argument is an Operable, each field of the caller is divided by the same field in the argument.
			If the argument is a number, each field of the caller will be divided by the argument.
			Returns the caller.
			(2)Parameters(/2)
			(p2)
				(param:other $Operable$)The Operable to divide the caller by.(/param)
				(param:number $Number$)The number to divide each field of the caller by.(/param)
			(/p2)
		(/method)
		(method:equals@other@$Boolean$)
			Returns whether or not the argument is approximately equal to the caller.
			(2)Parameters(/2)
			(p2)
				(param:other $Operable$)The Operable to compare to the caller.(/param)
			(/p2)
		(/method)
		(method:Operable.sum@values@$Operable$)
			Returns the element-wise sum of the values.
			(2)Parameters(/2)
			(p2)
				(param:values $Operable[]$)The list of values to sum.(/param)
			(/p2)
		(/method)
		(method:Operable.avg@values@$Operable$)
			Returns the element-wise average of the values.
			(2)Parameters(/2)
			(p2)
				(param:values $Operable[]$)The list of values to average.(/param)
			(/p2)
		(/method)
		(method:Operable.remap@n, a, b, a2, b2@$Operable$)
			Presuming that *n* is on [*a*, *b*] for all fields, returns where *n* would be if [*a*, *b*] were stretched and translated to be at [*a2*, *b2*].
			(2)Parameters(/2)
			(p2)
				(param:n $Operable$)The Operable to remap.(/param)
				(param:a $Operable$)The minimum of the starting range.(/param)
				(param:b $Operable$)The maximum of the starting range.(/param)
				(param:a2 $Operable$)The minimum of the ending range.(/param)
				(param:b2 $Operable$)The maximum of the ending range.(/param)
			(/p2)
		(/method)
		(method:Operable.clamp@n, min, max@$Operable$)
			Returns the closest point to *n* in the kD prism that *min* and *max* are the ends of.
			Each field is considered a dimension for the purposes of this method.
			(2)Parameters(/2)
			(p2)
				(param:n $Operable$)The Operable to be clamped between *min* and *max*.(/param)
				(param:min $Operable$)The Operable with the lowest value the closest point is allowed to have.(/param)
				(param:max $Operable$)The Operable with the highest value the closest point is allowed to have.(/param)
			(/p2)
		(/method)
		(method:Operable.filled@value@$Operable$)
			Returns an new Operable with every field initialized to the argument.
			(2)Parameters(/2)
			(p2)
				(param:value $Number$)The value for every field to take on.(/param)
			(/p2)
		(/method)
		(method:Operable.min@...values@$Operable$)
			Returns a new Operable where each field is the element-wise minimum of all the arguments fields.
			(2)Parameters(/2)
			(p2)
				(param:values $Operable[]$)The values to take the minimum of.(/param)
			(/p2)
		(/method)
		(method:Operable.max@...values@$Operable$)
			Returns a new Operable where each field is the element-wise maximum of all the arguments fields.
			(2)Parameters(/2)
			(p2)
				(param:values $Operable[]$)The values to take the maximum of.(/param)
			(/p2)
		(/method)
		(method:Operable.pow@value, power | value, powerOperable@$Operable$)
			Returns a new Operable where each field is the value of the field in the argument raised to the provided power.
			(2)Parameters(/2)
			(p2)
				(param:value $Operable$)The Operable to raise to a power.(/param)
				(param:power $Number$)The power to raise the operable to.(/param)
				(param:powerOperable $Operable$)The powers to raise each field of the Operable to.(/param)
			(/p2)
		(/method)
		(method:Operable.lerp@a, b, t@$Operable$)
			Returns a new Operable which is the linear interpolation from *a* to *b* with progress *t* on [0, 1].
			(2)Parameters(/2)
			(p2)
				(param:a $Operable$)The beginning of the linear interpolation.(/param)
				(param:b $Operable$)The end of the linear interpolation.(/param)
				(param:t $Number$)The amount of progress through the interpolation.(/param)
			(/p2)
		(/method)
	(/p)
`);