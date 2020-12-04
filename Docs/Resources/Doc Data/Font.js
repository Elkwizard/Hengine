load(String.raw`
	(1)(Class)Font(/1)
	(p)
		A Font is a data structure for storing fonts. It can also be used to measure text using given fonts. 
		Fonts are relatively expensive to construct, and therefore constructing one every frame should be avoided. 
	(/p)
	(2)Type(/2)
	(p)**
	class Font { ... }
	**(/p)
	(2)Syntax(/2)
	(p)**
	new Font(size, family[, bold, italic])
	**(/p)
	(2)Parameters(/2)
	(p)
		(param:size $Number$)The font size, in CSS Pixels.(/param)
		(param:family $String$)The CSS name of the font family.(/param)
		(param:bold $Boolean$)Whether or not the Font should be bold. Default is *false*.(/param)
		(param:italic $Boolean$)Whether or not the Font should be italic. Default is *false*.(/param)
	(/p)
	(2)Properties(/2)
	(p)
		(prop:size $Number$)The font size, in CSS Pixels.(/prop)
		(prop:lineHeight $Number$)The height of a line in this font, in CSS Pixels.(/prop)
		(prop:family $String$)The CSS name of the font family.(/prop)
		(prop:bold $Boolean$)Whether or not the Font should be bold.(/prop)
		(prop:italic $Boolean$)Whether or not the Font should be italic.(/prop)
		(prop:Font.[Arial, Monospace, Serif, Cursive][5, 10, ..., 95, 100] $Font$)A font with the the given family and font size. example: *Font.Arial25*.(/prop)
	(/p)
	(2)Methods(/2)
	(p)
		(method:getTextLineWidth@textLine@$Number$)
			Returns the width of the given text when displayed with this font.
			(2)Parameters(/2)
			(p2)
				(param:textLine $String$)A string with no line breaks to measure.(/param)
			(/p2)
		(/method)
		(method:getTextWidth@text@$Number$)
			Returns the width of the given text when displayed with this font.
			(2)Parameters(/2)
			(p2)
				(param:text $String$)A string to measure the width of.(/param)
			(/p2)
		(/method)
		(method:getTextHeight@text@$Number$)
			Returns the height of the given text when displayed with this font.
			(2)Parameters(/2)
			(p2)
				(param:text $String$)A string to measure the height of.(/param)
			(/p2)
		(/method)
		(method:getTextBounds@text@$Object$)
			Returns an object with a width$Number$ and height$Number$ containing the width and height of the given text when displayed with this font.
			(2)Parameters(/2)
			(p2)
				(param:text $String$)A string to measure the dimensions of.(/param)
			(/p2)
		(/method)
		(method:get@@$Font$)
			Returns a copy of the Font.
		(/method)
		(method:Font.importFamily@font, url@$void$)
			Imports a given font family from a URL.
			(2)Parameters(/2)
			(p2)
				(param:font $String$)The official name of the font family from the URL.(/param)
				(param:url $String$)The URL that contains the font family.(/param)
			(/p2)
		(/method)
	(/p)
`);