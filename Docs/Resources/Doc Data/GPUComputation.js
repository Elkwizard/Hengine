load(String.raw`
	(1)(Class)GPUComputation(/1)
	(p)
		The GPUComputation is a data structure for doing arbitrary non-graphics related parallel processing. 
		Operations are written in GLSL and can be run with a maximum of 64 bytes of input and 4 bytes of output.
	(/p)
	(2)Type(/2)
	(p)**
	class GPUComputation { ... }
	**(/p)
	(2)Syntax(/2)
	(p)**
	new GPUComputation(dataSize, inputKeys, inputRanges, outputRanges, operation)
	**(/p)
	(2)Parameters(/2)
	(p)
		(param:dataSize $Number$)The amount of elements that will be processed in parallel in each operation. Maximum is 1,048,576 for 64 input bytes, or approximately 67,108,864 divided by *inputKeys.length*.(/param)
		(param:inputKeys $String[]$)An array of names for each input bytes.(/param)
		(param:inputRanges $Range[]$)A list of #Range#s for each of the input bytes to be mapped to.(/param)
		(param:outputRanges $Range[]$)A list of #Range#s for each of the output bytes to be mapped to.(/param)
		(param:operation $String$)GLSL code that defines a function called *vec4 compute(Input data)*, where *data* is an object that has a property for each input byte, associated with it's name from *inputKeys*.(/param)
	(/p)
	(2)Properties(/2)
	(p)
		(prop:inputKeys $String[]$readonly)An array of names for each input bytes.(/prop)
		(prop:inputRanges $Range[]$readonly)A list of #Range#s for each of the input bytes to be mapped to.(/prop)
		(prop:outputRanges $Range[]$readonly)A list of #Range#s for each of the output bytes to be mapped to.(/prop)
	(/p)
	(2)Methods(/2)
	(p)
		(method:compile@@$void$)
			Compiles the operation. This function must be called before calling compute.
		(/method)
		(method:compute@buffer@$void$)
			Runs the GPUComputation's operation on the provided buffer. The output will be stored in the buffer afterwards.
			(2)Parameters(/2)
			(p2)
				(param:buffer $GPUComputationByteBuffer[]$)The buffer to compute. The current contents of the buffer will be used as input, and the output will be written after the operation.(/param)
			(/p2)
			(/method)
		(method:createBuffer@@$GPUComputationByteBuffer[]$)
			Returns a new computation buffer associated with the given GPUComputation.
		(/method)
		(method:writeBufferInput@buffer, index, input@$void$)
			Writes the values from the input object into the provided buffer at the provided index.
			(2)Parameters(/2)
			(p2)
				(param:buffer $GPUComputationByteBuffer[]$)The buffer that should be written to.(/param)
				(param:index $Number$)The operation input index that should be written to.(/param)
				(param:input $Object$)The object containing a property for every key in *inputKeys*. This values will be mapped through the inputRanges and written to the buffer.(/param)
			(/p2)
		(/method)
		(method:readBufferOutput@buffer, index, keys@$Object$)
			Reads the output values from the provided buffer into an object with the provided keys.
			(2)Parameters(/2)
			(p2)
				(param:buffer $GPUComputationByteBuffer[]$)The buffer that should be read from.(/param)
				(param:index $Number$)The operation output index that should be read.(/param)
				(param:keys $String[]$)The keys of the return object whose values will be the output values (mapped through the outputRanges).(/param)
			(/p2)
		(/method)
	(/p)
`);