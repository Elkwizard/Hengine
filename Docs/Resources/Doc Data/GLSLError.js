load(String.raw`
	(1)(Class)GLSLError(/1)
	(p)
		A GLSLError is a data structure to store an error thrown by compiling #GLSL# code.
		Do not construct GLSLErrors.
	(/p)
	(2)Type(/2)
	(p)**
	class GLSLError extends Error { ... }
	**(/p)
	(2)Properties(/2)
	(p)
		(prop:line $Number$)The line number that the error occurred on.(/prop)
		(prop:desc $String$)The description of the error that occurred at the specified line.(/prop)
	(/p)
`);