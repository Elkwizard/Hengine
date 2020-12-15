load(String.raw`
	(1)(Class)HImage(/1)
	(p)
		An HImage is a representation of an image from a file path. HImages cannot have their pixels modified or read.
		HImages are the only way to get images from a server or computer into the Hengine.
	(/p)
	(2)Type(/2)
	(p)**
	class HImage extends #ImageType# { ... }
	**(/p)
	(2)Syntax(/2)
	(p)**
	new HImage(src)
	**(/p)
	(2)Parameters(/2)
	(p)
		(param:src $String$)The file path to the image the HImage should represent.(/param)
	(/p)
	(2)Properties(/2)
	(p)
		(prop:src $String$readonly)The file path to the image the HImage represents.(/prop)
	(/p)
	(2)Methods(/2)
	(p)
		(method:HImage.imageExists@src@ $Boolean$async)
			Checks whether there is an image at the given source. If not, an error will be thrown, and this method will return *false*.
			If the image does exist, the method will return *true*.
			(2)Parameters(/2)
			(p2)
				(param:src $String$)The file path to the image that is being checked.(/param)
			(/p2)
		(/method)
	(/p)
`);