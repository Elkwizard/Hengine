load(String.raw`
	(1)(Class)Hengine(/1)
	(p)
		The Hengine represents the highest level container for the elements of the Hengine. 
		It also serves as the object for accessing the DOM representation of the Hengine's Canvas on the page. 
	(/p)
	(2)Type(/2)
	(p)**
	class Hengine { ... }
	**(/p)
	(2)Syntax(/2)
	(p)**
	new Hengine()
	**(/p)
	(2)Properties(/2)
	(p)
		(prop:mouse $MouseHandler$)
			The #MouseHandler# associated with the Hengine instance. 
			This tracks mouse events and data, such as movement, clicking, and position in both screen space and world space.
		(/prop)
		(prop:keyboard $KeyboardHandler$)
			The #KeyboardHandler# associated with the Hengine instance.
			This tracks key presses and the pressure state for all keys.
		(/prop)
		(prop:clipboard $ClipboardHandler$)
			The #ClipboardHandler# associated with the Hengine instance.
			This allows for support of native clipboard reading and writing.
		(/prop)
		(prop:intervals $IntervalManager$)
			The #IntervalManager# that runs the update loop for the Hengine instance. 
			This keeps the Hengine running and tracks performance.
		(/prop)
		(prop:canvas $CanvasManager$)
			The #CanvasManager# associated with the Hengine instance.
			This manages the presence of the Hengine's canvas within the DOM.
		(/prop)
		(prop:renderer $Renderer$)
			The #Renderer# associated with the Hengine instance.
			This draws #SceneObject#s to the screen as well as evaluating many custom render commands.
		(/prop)
		(prop:scene $Scene$)
			The #Scene# that manages all of the #SceneObject#s in the Hengine instance.
			This manages the physics and camera rendering of all of the #SceneObject#s.
		(/prop)
	(/p)
	(2)Methods(/2)
	(p)
		(method:end@@$void$)
			Ends the #IntervalManager# and deletes the canvas.
		(/method)
	(/p)
`);


// (prop:scalingMode $ScalingMode.Symbol$)
// How the aspect ratio of the canvas should be preserved when scaling to fit the screen. 
// For *ScalingMode.STRETCH*, the canvas will expand to fit the edges of the screen, ignoring aspect ratio.
// For *ScalingMode.PRESERVE_ASPECT_RATIO*, the canvas will expand to fit the edges of the screen while still maintaining aspect ratio.
// For *ScalingMode.INTEGER_MULTIPLE*, the canvas will expand to fit the edges of the screen, while still maintaining an aspect ratio, and only scaling by integers.
// Default value is *ScalingMode.STRETCH*.
// (/prop)