load(String.raw`
	(1)(Class)GPUComputation(/1)
	(p)
		The GPUComputation is a data structure for doing arbitrary parallel processing on the GPU. 
		Operations are written in #GLSL# and can be run with any number of input bytes and up to 64 bytes of output.
	(/p)
	(2)GLSL Specification(/2)
	(p)
		The #GLSL# must define a function *int[OUTPUT_BYTES] compute(int[INPUT_BYTES] data)*,
		where *data* is a list of integers from 0-255 representing the input bytes, and the return value is
		an array of 0-255 numbers representing output bytes.
	(/p)
	(2)Type(/2)
	(p)**
	class GPUComputation { ... }
	**(/p)
	(2)Syntax(/2)
	(p)**
	new GPUComputation(problems, operation)
	**(/p)
	(2)Parameters(/2)
	(p)
		(param:problems $Number$)The amount of computations to performed in parallel.(/param)
		(param:operation $String$)The #GLSL# string to use as the computation.(/param)
	(/p)
	(2)Properties(/2)
	(p)
		(prop:glsl $String$)The #GLSL# string to use as the computation.(/prop)
		(prop:problems $Number$readonly)The amount of computations to performed in parallel.(/prop)
	(/p)
	(2)Methods(/2)
	(p)
		(method:compute@inputBuffer[, outputBuffer]@$void$)
			Runs the GPUComputation's operation on the provided buffer. The output will be stored in the buffer afterwards.
			(2)Parameters(/2)
			(p2)
				(param:inputBuffer $ByteBuffer[]$)The buffer to compute. The current contents of the buffer will be used as input, and the output will be written to *outputBuffer*.(/param)
				(param:outputBuffer $ByteBuffer[]$)The buffer to put the computation results in. The default value is a new #ByteBuffer#.(/param)
			(/p2)
		(/method)
		(method:getArgument@arg@$any$)
			Gets the value of the specified uniform within the #GLSL# program.
			(2)Parameters(/2)
			(p2)
				(param:arg $String$)
					The name of the uniform to get the value of.
				(/param)
			(/p2)
		(/method)
		(method:setArgument@arg, value@$void$)
			Sets the value of the given uniform to the given value.
			(2)Parameters(/2)
			(p2)
				(param:arg $String$)
					The name of the uniform to set the value of.
				(/param)
				(param:value $any$)
					The value to set the uniform to.
				(/param)
			(/p2)
		(/method)
		(method:setArguments@args@$void$)
			Sets the value of the specified uniforms within the #GLSL# program.
			(2)Parameters(/2)
			(p2)
				(param:args $Object$)
					The uniforms to set. This Object should be in the form *{ uniform: uniformValue, uniform2: uniform2Value }*.
				(/param)
			(/p2)
		(/method)
	(/p)
`);