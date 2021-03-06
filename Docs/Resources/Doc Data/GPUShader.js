load(String.raw`
	(1)(Class)GPUShader(/1)
	(p)
		A GPUShader is a data structure for storing the results of, and compiling, GLSL code on the GPU.
		GPUShaders run code in parallel, making them much more efficient than their CPU counterparts \(#Texture#s\).
	(/p)
	(2)Notes on Hengine Flavored GLSL:(/2)
	(p)
		Shaders start at a *highp vec4 shader() { ... }* function, as opposed to *void main() { ... }*. *gl_FragColor* will be set to the return value of *shader()*. 
		Hengine shaders are given *highp vec2 position* and *highp vec2 resolution* uniforms to base pixel colors off of. 
		*position* is measured from the upper left, and both *position* and *resolution* are measured in CSS Pixels.
	(/p)
	(2)GLSL to JS Types(/2)
	(p)
		The type correspondences between languages are as follows: 
		(p2)**<table>
			<tr><td>GLSL</td><td>JS</td></tr>
			<tr><td>float | int</td><td>Number</td></tr>
			<tr><td>vec2 | ivec2</td><td>#Vector2#</td></tr>
			<tr><td>vec3 | ivec3</td><td>#Vector3#</td></tr>
			<tr><td>vec4 | ivec4</td><td>#Vector4# | #Color#</td></tr>
			<tr><td>sampler2D</td><td>#ImageType#</td></tr>
		</table>**(/p2)
	(/p)
	(2)Type(/2)
	(p)**
	class GPUShader extends #ImageType# { ... }
	**(/p)
	(2)Syntax(/2)
	(p)**
	new GPUShader(width, height, GLSL)
	**(/p)
	(2)Parameters(/2)
	(p)
		(param:width $Number$)The width, in CSS Pixels of the GPUShader's domain.(/param)
		(param:height $Number$)The height, in CSS Pixels of the GPUShader's domain.(/param)
		(param:GLSL $String$)GLSL code to shade the domain of the GPUShader.(/param)
	(/p)
	(2)Properties(/2)
	(p)
		(prop:glsl $String$readonly)The GLSL code to shade the domain of the GPUShader.(/prop)
		(prop:shadeRects $Rect[]$readonly)A list of #Rect#s within the boundary of the GPUShader that will have the shader run. Initially an empty array, signifying that the entire domain will be shaded.(/prop)
		(prop:errorLog $String[]$readonly)A list of all of the GLSL errors thrown during compilation.(/prop)
		(prop:compileState $Object$)An object with two properties, compiled$Boolean$ and error$GLSLError[]$. compiled will be whether or not the compilation was successful, and error is a list of all the errors that were thrown if it didn't compile.(/prop)
	(/p)
	(2)Methods(/2)
	(p)
		(method:setShadeRects@rects@$void$)
			Sets the regions where the GPUShader's GLSL will run.
			(2)Parameters(/2)
			(p2)
				(param:rects $Rect[]$)The new rectangular domains to shade on the GPUShader.(/param)
			(/p2)
		(/method)
		(method:getArgument@arg@$any$)
			Gets the value of the specified uniform within the GLSL program.
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
			Sets the value of the specified uniforms within the GLSL program.
			(2)Parameters(/2)
			(p2)
				(param:args $Object$)
					The uniforms to set. This Object should be in the form *{ uniform: uniformValue, uniform2: uniform2Value }*.
				(/param)
			(/p2)
		(/method)
		(method:resize@width, height@$void$)
			Sets the maximum domain of the GPUShader.
			(2)Parameters(/2)
			(p2)
				(param:width $Number$)The new width for the GPUShader.(/param)
				(param:height $Number$)The new height for the GPUShader.(/param)
			(/p2)
		(/method)
	(/p)
`)