load(String.raw`
	(1)(Class)Frame(/1)
	(p)
		A Frame is a data structure that represents a procedural image.
		Frames are initialized as all transparent black, and can be drawn onto with their provided #Renderer#.
		Frames are used for preprocessing graphics, copying procedural graphics, and local coordinate transforms.
	(/p)
	(2)Type(/2)
	(p)**
	class Frame extends #ImageType# { ... }
	**(/p)
	(2)Subclasses(/2)
	(p)
		#GraphPlane#
	(/p)
	(2)Syntax(/2)
	(p)**
	new Frame(width, height)
	**(/p)
	(2)Parameters(/2)
	(p)
		(param:width $Number$)The width of the Frame in CSS Pixels(/param)
		(param:height $Number$)The height of the Frame in CSS Pixels(/param)
	(/p)
	(2)Properties(/2)
	(p)
		(prop:renderer $Renderer$)A #Renderer# that targets the Frame. All draw calls to this #Renderer# will be drawn onto the Frame.(/prop)
	(/p)
	(2)Methods(/2)
	(p)
		(method:clip@x, y, width, height | region@$Frame$)
			Returns the Frame representation of the pixels within the specified rectangle on the Frame.
			(2)Parameters(/2)
			(p2)
				(param:x $Number$)The X coordinate of the left extent of the rectangle.(/param)
				(param:y $Number$)The Y coordinate of the top extent of the rectangle.(/param)
				(param:width $Number$)The width of the rectangle.(/param)
				(param:height $Number$)The height of the rectangle.(/param)
				(param:region $Rect$)A #Rect# object containing the rectangular region.(/param)
			(/p2)
		(/method)
		(method:get@@$Frame$)
			Returns a copy of the Frame.
		(/method)
		(method:Frame.fromImageType@imageType, x, y, width, height | renderer, region@$Frame$)
			Returns a Frame representation of the pixels within the specified region in the given #ImageType#.
			(2)Parameters(/2)
			(p2)
				(param:imageType $ImageType$)The #ImageType# that the pixels are to be sampled from.(/param)
				(param:x $Number$)The X coordinate of the left extent of the rectangle.(/param)
				(param:y $Number$)The Y coordinate of the top extent of the rectangle.(/param)
				(param:width $Number$)The width of the rectangle.(/param)
				(param:height $Number$)The height of the rectangle.(/param)
				(param:region $Rect$)A #Rect# object containing the rectangular region.(/param)
			(/p2)
		(/method)
		(method:Frame.fromImageType@imageType@$Frame$)
			Returns a Frame representation of the given #ImageType#.
			(2)Parameters(/2)
			(p2)
				(param:imageType $ImageType$)The #ImageType# to be reinterpreted.(/param)
			(/p2)
		(/method)
		
	(/p)
`);