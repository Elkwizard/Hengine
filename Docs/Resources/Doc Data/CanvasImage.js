load(String.raw`
	(1)(Class)CanvasImage(/1)
	(p)
		A CanvasImage is a class for manipulating the DOM representation and basic rendering of the Hengine's canvas. 
		Do not construct CanvasImages.
	(/p)
	(2)Type(/2)
	(p)**
	class CanvasImage extends #ImageType# { ... }
	**(/p)
	(2)Syntax(/2)
	(p)**
	new CanvasImage(canvas, engine)
	**(/p)
	(2)Parameters(/2)
	(p)
		(param:canvas $HTMLCanvasElement$)The canvas DOM element that the CanvasImage should manage.(/param)
		(param:engine $Hengine$)The #Hengine# the canvas belongs to.(/param)
	(/p)
	(2)Properties(/2)
	(p)
		(prop:canvas $HTMLCanvasElement$readonly)The canvas DOM element that the CanvasImage is managing.(/prop)
		(prop:engine $Hengine$readonly)The #Hengine# the canvas belongs to.(/prop)
		(prop:cursor $String$)The CSS name of the cursor that the canvas should use. Starts at *default*.(/prop)
		(prop:clearScreen $Function$)The function that should be called to clear the screen. Starts at *() => renderer.fill(Color.WHITE)*.(/prop)
	(/p)
`);