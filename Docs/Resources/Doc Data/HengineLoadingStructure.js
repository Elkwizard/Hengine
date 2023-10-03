load(String.raw`
	(1)(Class)HengineLoadingStructure(/1)
	(p)
		A data structure to schedule and simplify the loading of #HengineResource#s.
		It allows for chaining of calls to add items to a loading queue, which can eventually be loaded simultaneously.
	(/p)
	(2)Type(/2)
	(p)**
	class HengineLoadingStructure { ... }
	**(/p)
	(2)Syntax(/2)
	(p)**
	new HengineLoadingStructure()
	**(/p)
	(2)Methods(/2)
	(p)
		(method:load@@ $Promise$)
			Loads all queued resources and returns a promise which resolves when they all have completed loading.
			This method may only be called once per instance.
		(/method)
		(method:script@src@ $HengineLoadingStructure$)
			Creates and inserts a #HengineScriptResource# into the queue.
			(2)Parameters(/2)
			(p2)
				(param:src $String$)The path to the script to be loaded.(/param)
			(/p2)
		(/method)
		(method:text@src@ $HengineLoadingStructure$)
			Creates and inserts a #HengineTextResource# into the queue.
			(2)Parameters(/2)
			(p2)
				(param:src $String$)The path to the text file to be loaded.(/param)
			(/p2)
		(/method)
		(method:binary@src@ $HengineLoadingStructure$)
			Creates and inserts a #HengineBinaryResource# into the queue.
			(2)Parameters(/2)
			(p2)
				(param:src $String$)The path to the binary file to be loaded.(/param)
			(/p2)
		(/method)
		(method:image@src@ $HengineLoadingStructure$)
			Creates and inserts a #HengineImageResource# into the queue.
			(2)Parameters(/2)
			(p2)
				(param:src $String$)The path to the image to be loaded.(/param)
			(/p2)
		(/method)
		(method:font@src@ $HengineLoadingStructure$)
			Creates and inserts a #HengineFontResource# into the queue.
			(2)Parameters(/2)
			(p2)
				(param:src $String$)The path to the font to be loaded.(/param)
			(/p2)
		(/method)
		(method:animation@src, options: { loops, delay, frames }@ $HengineLoadingStructure$)
			Creates and inserts a #HengineAnimationResource# into the queue.
			(2)Parameters(/2)
			(p2)
				(param:src $String$)The path to the animation to be loaded.(/param)
				(param:options.loops $Boolean$)Whether or not the animation loops.(/param)
				(param:options.delay $Number$)The delay between animation frames.(/param)
				(param:options.frames $Number$)The number of frames in the animation.(/param)
			(/p2)
		(/method)
		(method:sound@src, options: { loops }@ $HengineLoadingStructure$)
			Creates and inserts a #HengineSoundResource# into the queue.
			(2)Parameters(/2)
			(p2)
				(param:src $String$)The path to the sound to be loaded.(/param)
				(param:options.loops $Boolean$)Whether or not the sound loops.(/param)
			(/p2)
		(/method)
		(method:video@src, options: { loops }@ $HengineLoadingStructure$)
			Creates and inserts a #HengineVideoResource# into the queue.
			(2)Parameters(/2)
			(p2)
				(param:src $String$)The path to the video to be loaded.(/param)
				(param:options.loops $Boolean$)Whether or not the video loops.(/param)
			(/p2)
		(/method)
	(/p)
`);