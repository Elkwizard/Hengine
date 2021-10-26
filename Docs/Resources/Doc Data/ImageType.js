load(String.raw`
	(1)(Class)ImageType(/1)
	(p)
		An interface for data structures storing images of various types.
		ImageType cannot be constructed, only subclasses of it can be. This is the object used to represent images in the Hengine. 
		ImageType provides a universal API for interacting with disparate graphical data.
	(/p)
	(2)Type(/2)
	(p)**
	class ImageType { ... }
	**(/p)
	(2)Subclasses(/2)
	(p)
		#HImage#, #VideoView#, #Frame#, #Animation#, #WebcamCapture#, #Texture#, #GraphPlane#, #GPUShader#.
	(/p)
	(2)Properties(/2)
	(p)
		(prop:width$Number$)The width in CSS Pixels of the ImageType.(/prop)
		(prop:height$Number$)The height in CSS Pixels of the ImageType.(/prop)
		(prop:loaded$Boolean$readonly)Whether or not the ImageType has been loaded. The ImageType will be renderable without errors before loading, but will be a single transparent pixel.(/prop)
	(/p)
	(2)Methods(/2)
	(p)
		(method:makeImage@@$CanvasImageSource$)
			Returns the CanvasImageSource representation of the ImageType. Used for rendering to the underlying canvas API.
		(/method)
		(method:resize@width, height@$void$)
			Resizes the ImageType with the given dimensions.
			(2)Parameters(/2)
			(p2)
				(param:width$Number$)The new width of the ImageType.(/param)
				(param:height$Number$)The new height of the ImageType.(/param)
			(/p2)
		(/method)
		(method:contains@x, y | point@$Boolean$)
			Returns whether or not the given point is within the inclusive bounds of the ImageType.
			(2)Parameters(/2)
			(p2)
				(param:x$Number$)The x coordinate of the point to check.(/param)
				(param:y$Number$)The y coordinate of the point to check.(/param)
				(param:point$Vector2$)The coordinates of the point to check.(/param)
			(/p2)
		(/method)
		(method:inferWidth@height@$Number$)
			Returns the width of the image if the height was the provided number and the aspect ratio was constant.
			(2)Parameters(/2)
			(param:height$Number$)The scaled height to apply the aspect ratio to.(/param)
		(/method)
		(method:inferHeight@width@$Number$)
		Returns the height of the image if the width was the provided number and the aspect ratio was constant.
			(2)Parameters(/2)
			(param:width$Number$)The scaled width to apply the aspect ratio to.(/param)
		(/method)
	(/p)
`);