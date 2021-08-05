load(String.raw`
	(1)(Class)GLSLError(/1)
	(p)
		A GLSLError is a data structure to store an error thrown by compiling #GLSL# code.
		Do not construct GLSLErrors.
	(/p)
	(2)Type(/2)
	(p)**
	class GLSLError { ... }
	**(/p)
	(2)Syntax(/2)
	(p)**
	new GLSLError(gl, prefixLength)
	**(/p)
	(2)Parameters(/2)
	(p)
		(param:gl $String$)The error string directly from WebGL.(/param)
		(param:prefixLength $Number$)The size of the pre-inserted #GLSL# before the user code.(/param)
	(/p)
	(2)Properties(/2)
	(p)
		(prop:line $Number$)The line number that the error occurred on.(/prop)
		(prop:desc $String$)The description of the error that occurred at the specified line.(/prop)
	(/p)
`);