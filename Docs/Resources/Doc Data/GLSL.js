load(String.raw`
	(1)Hengine Flavored GLSL(/1)
	(p)
		The Hengine uses a wrapped version of GLSL for #GPUShader#s and #GPUComputation#s.
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
		Matrix types (*mat2*, *mat3*, *mat4*) are represented as column major Iterables.
		This means that #Matrix3# works as a value for *mat3*.
	(/p)
`);