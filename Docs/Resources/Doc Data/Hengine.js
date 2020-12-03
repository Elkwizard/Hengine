load(String.raw`
	(1)(Class)Hengine(/1)
	(p)
		The Hengine represents the highest level container for the elements of the Hengine. 
		It also serves as the object for accessing the DOM representation of the Hengine's Canvas on the page. 
		The Hengine's Canvas will be expanded to fit the window with the aspect ratio of *.renderer*.
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
		(prop:renderer $Renderer$)
			The #Renderer# associated with the Hengine instance.
			This draws #SceneObject#s to the screen as well as evaluating many custom render commands.
		(/prop)
		(prop:scene $Scene$)
			The #Scene# that manages all of the #SceneObject#s in the Hengine instance.
			This manages the physics and camera rendering of all of the #SceneObject#s.
		(/prop)
		(prop:resize $Boolean$)
			Whether or not the *.renderer*'s canvas expands to fill the screen after the browser window changes size.
		(/prop)
	(/p)
	(2)Methods(/2)
	(p)
		(method:end@@$void$)
			Ends the #IntervalManager# and deletes the canvas.
		(/method)
	(/p)
`);