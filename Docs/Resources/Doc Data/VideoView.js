load(String.raw`
	(1)(Class)VideoView(/1)
	(p)
		A VideoView is a representation of the image stream from a given video.
		Each time it is drawn, it will display the current frame. 
	(/p)
	(2)Type(/2)
	(p)**
	class VideoView extends #ImageType# { ... }
	**(/p)
	(2)Syntax(/2)
	(p)**
	new VideoView(src[, loops])
	**(/p)
	(2)Parameters(/2)
	(p)
		(param:src $String$)The source of the video to be played.(/param)
		(param:loops $Boolean$)Whether or not the video should repeat when it reaches the end. Default is *false*.(/param)
	(/p)
	(2)Properties(/2)
	(p)
		(prop:playing $Boolean$readonly)Whether or not the video should keep selecting the next frame.(/prop)
	(/p)
	(2)Methods(/2)
	(p)
		(method:getFrame@@$Frame$)
			Returns a #Frame# representation of the current frame from the video.
		(/method)
		(method:pause@@$void$)
			Stops the VideoView from drawing new frames.
		(/method)
		(method:play@@$void$)
			Resumes the VideoView's drawing of new frames.
		(/method)
	(/p)
`);