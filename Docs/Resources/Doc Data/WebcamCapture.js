load(String.raw`
	(1)(Class)WebcamCapture(/1)
	(p)
		A WebcamCapture is a representation of the image stream from the camera.
		Each time it is drawn, it will display the current frame. 
		Creating a WebcamCapture will prompt the user with a security check.
	(/p)
	(2)Type(/2)
	(p)**
		class WebcamCapture extends #ImageType# { ... }
	**(/p)
	(2)Syntax(/2)
	(p)**
		new WebcamCapture()
	**(/p)
	(2)Properties(/2)
	(p)
		(prop:recording $Boolean$readonly)Whether or not the WebcamCapture will continue accepting new frames from the camera(/prop)
	(/p)
	(2)Methods(/2)
	(p)
		(method:getFrame@@$Frame$)
			Returns a #Frame# representation of the current frame from the camera.
		(/method)
		(method:pause@@$void$)
			Stops the WebcamCapture from accepting new frames.
		(/method)
		(method:play@@$void$)
			Resumes the WebcamCapture's acceptance of new frames.
		(/method)
	(/p)
`);