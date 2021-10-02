load(String.raw`
	(1)(Class)IntervalManager(/1)
	(p)
		The IntervalManager is a object that synchronizes, updates, and monitors the performance of the Hengine every frame. 
		Do not construct IntervalManagers.
	(/p)
	(2)Type(/2)
	(p)**
	class IntervalManager { ... }
	**(/p)
	(2)Properties(/2)
	(p)
		(prop:fps $Number$readonly)The current amount of frames that are run per second. This value is smoothed, so drastic changes might take around 30 frames to become noticable in this property.(/prop)
		(prop:rawFps $Number$readonly)The current amount of frames that are run per second. This value is not smoothed.(/prop)
		(prop:frameCount $Number$readonly)The current amount of frames that have been drawn.(/prop)
		(prop:fpsGraph $GraphPlane$readonly)A #GraphPlane# that has one #Graph#, which is of *.fps*.(/prop)
		(prop:performanceData $Boolean$)Whether or not the IntervalManager should track performance data. Default is *true*.(/prop)
	(/p)
	(2)Methods(/2)
	(p)
		(method:pause@@$void$)
			Halts the execution of the entire update loop for the Hengine.
		(/method)
		(method:play@@$void$)
			Restarts the execution of the update loop for the Hengine.
		(/method)
		(method:continuous@fn[, type]@$void$)
			Creates and inserts a #ContinuousFunction# with the given parameters.
			(2)Parameters(/2)
			(p2)
				(param:fn $Function$)The Function to be used for the #ContinuousFunction#.(/param)
				(param:type $IntervalFunction.Symbol$)The placement in the execution cycle that the #ContinuousFunction# should have. Default is #IntervalFunction#.AFTER_UPDATE(/param)
			(/p2)
		(/method)
		(method:transition@fn, duration[, type]@$void$)
			Creates and inserts a #TransitionFunction# with the given parameters.
			(2)Parameters(/2)
			(p2)
				(param:fn $Function$)The Function to be used for the #TransitionFunction#.(/param)
				(param:duration $Number$)The duration of the transition.(/param)
				(param:type $IntervalFunction.Symbol$)The placement in the execution cycle that the #TransitionFunction# should have. Default is #IntervalFunction#.BEFORE_UPDATE(/param)
			(/p2)
		(/method)	
		(method:animate@object, property, value, duration[, curve, type]@$void$)
			Interpolates a property of a given object over time based on a provided interpolation curve.
			(2)Parameters(/2)
			(p2)
				(param:object $Object$)The Object whose property should be animated.(/param)
				(param:property $String$)The name of the property that should be animated.(/param)
				(param:value $any$)The final value for the property.(/param)
				(param:duration $Number$)The duration of the animation.(/param)
				(param:curve $Function$)A function that takes in a linearly interpolated value and returns the correct interpolation value. Default is #Interpolation#.linear(/param)
				(param:type $IntervalFunction.Symbol$)The placement in the execution cycle that the animated value should change. Default is #IntervalFunction#.BEFORE_UPDATE(/param)
			(/p2)
		(/method)	
		(method:delay@fn, wait[, type]@$void$)
			Creates and inserts a #DelayedFunction# with the given parameters.
			(2)Parameters(/2)
			(p2)
				(param:fn $Function$)The Function to be used for the #DelayedFunction#.(/param)
				(param:wait $Number$)How long to wait to execute the provided Function.(/param)
				(param:type $IntervalFunction.Symbol$)The placement in the execution cycle that the #DelayedFunction# should have. Default is #IntervalFunction#.BEFORE_UPDATE(/param)
			(/p2)
		(/method)
		(method:waitUntil@fn, event[, type]@$void$)
			Creates and inserts a #WaitUntilFunction# with the given parameters.
			(2)Parameters(/2)
			(p2)
				(param:fn $Function$)The Function to be used for the #WaitUntilFunction#.(/param)
				(param:event $Function$)The event trigger for the #WaitUntilFunction#.(/param)
				(param:type $IntervalFunction.Symbol$)The placement in the execution cycle that the #WaitUntilFunction# should have. Default is #IntervalFunction#.BEFORE_UPDATE(/param)
			(/p2)
		(/method)
		(method:makeGraphPlane@graphs, frameLimit@$GraphPlane$)
			Creates a #GraphPlane# based on the provided settings.
			(2)Parameters(/2)
			(p2)
				(param:graphs $Graph[]$)All the #Graph#s that should be displayed on the #GraphPlane#.(/param)
				(param:frameLimit $Number$)The length of the time axis on the #GraphPlane#.(/param)
			(/p2)
		(/method)
	(/p)
`);