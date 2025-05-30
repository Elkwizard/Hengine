/**
 * Represents a material applied to a MeshChunk.
 * @prop Boolean transparent | Whether or not light can pass through the material
 */
class Material {
	constructor() {
		this.uniforms = { };
	}
}
Lazy.define(Material, "DEFAULT", () => new SimpleMaterial());

/**
 * Represents a custom shader-based material with a user-specified vertex and fragment shader programs.
 */
class ShaderMaterial extends Material {
	/**
	 * Creates a new custom material.
	 * @prop String fragmentShader? | The source code for the fragment shader. The default produces an opaque white color under all circumstances
	 * @prop String vertexShader? | The source code for the vertex shader. The default projects the vertex position and passes on no information to the fragment shader
	 */
	constructor(
		fragmentShader = ShaderMaterial.DEFAULT_FRAGMENT_SHADER,
		vertexShader = ShaderMaterial.DEFAULT_VERTEX_SHADER
	) {
		super();
		this.fragmentShader = new GLSL(fragmentShader);
		this.vertexShader = new GLSL(vertexShader);
		this.transparent = false;
	}
}
ShaderMaterial.DEFAULT_VERTEX_SHADER = `
	uniform float time; 

	vec3 shader() {
		return vertexPosition;// + vec3(0, sin(vertexPosition.x * 0.5 + time * 0.1) * 2.0, 0);
	}
`;
ShaderMaterial.DEFAULT_FRAGMENT_SHADER = `
	vec4 shader() {
		return vec4(1);
	}
`;

/**
 * Represents a basic parameterized material based on the Blinn-Phong Shading Model.
 * @prop Color albedo | The base color of the material, against which ambient and diffuse lighting are calculated. Starts as white
 * @prop Color emission | The color of light emitted from the material. Starts as black
 * @prop Color specular | The color of specular highlights on the material. Starts as white
 * @prop ImageType/Sampler albedoTexture | The texture to use in in place of the `.albedo` color. It will sampled according to the mesh's UVs
 * @prop ImageType/Sampler specularTexture | The texture to use in in place of the `.specular` color. It will sampled according to the mesh's UVs
 * @prop Number specularExponent | The exponent applied during specular highlight calculation. Higher values correspond to sharper highlights. Starts as 0
 * @prop Number alpha | The opacity of the material. Starts as 1
 */
class SimpleMaterial extends Material {
	/**
	 * Creates a new material based on certain surface settings.
	 * @param Object settings | An object where each entry corresponds to a property of SimpleMaterial
	 */
	constructor(settings = { }) {
		super();
		
		this.vertexShader = SimpleMaterial.VERTEX_SHADER;
		this.fragmentShader = SimpleMaterial.FRAGMENT_SHADER;
		this.uniforms = { Material: this };
		const textureSettings = ["albedoTexture", "specularTexture"];
		for (let i = 0; i < textureSettings.length; i++) {
			objectUtils.onChange(this, textureSettings[i], (key, value) => {
				const scalar = key.replace("Texture", "");
				this[scalar] ??= Color.BLACK.get();
				if (value) {
					this[scalar].alpha = 0;
					this.uniforms[key] = value;
				} else {
					this[scalar].alpha = 1;
					delete this.uniforms[key];
				}
			});
		}

		Object.assign(this, settings);

		// defaults
		this.albedo ??= Color.WHITE.get();
		this.specular ??= Color.WHITE.get();
		this.emission ??= Color.BLACK.get();
		this.specularExponent ??= 0;
		this.alpha ??= 1;
	}
	/**
	 * Sets `.albedo`, `.specular`, and `.emission` to the same value.
	 * @param Color color | The new color value
	 */
	set color(a) {
		this.albedo.set(a);
		this.specular.set(a);
		this.emission.set(a);
		this.albedo.alpha = 1;
		this.specular.alpha = 1;
	}
	get transparent() {
		return this.alpha < 1.0;
	}
}
SimpleMaterial.VERTEX_SHADER = new GLSL(ShaderMaterial.DEFAULT_VERTEX_SHADER);
SimpleMaterial.FRAGMENT_SHADER = new GLSL(`
	uniform Material {
		vec4 albedo;
		vec4 specular;
		vec3 emission;
		float specularExponent;
		float alpha;
	} material;
		
	uniform sampler2D albedoTexture;
	uniform sampler2D specularTexture;
	
	vec2 fractal(vec2 uv) {
		uv = mod(uv, 0.5) * 2.0;
		uv = abs(uv - 0.5) + 0.5;
		uv -= 0.5;
		float t = time * 0.01;
		float c = cos(t);
		float s = sin(t);
		uv = vec2(uv.x * c - uv.y * s, uv.x * s + uv.y * c);
		uv += 0.5;
		return uv;
	}

	#define MAYBE_TEXTURE(scalar, tex) (material.scalar.a > 0.0 ? material.scalar.rgb : texture(tex, uv).rgb)

	vec4 shader() {
		vec3 view = normalize(position - camera.position);
		vec3 refl = reflect(view, normal);

		// return vec4(implicitNormal(position) * 0.5 + 0.5, 1.0);
		// return vec4((normal - implicitNormal(position)) * 0.5 + 0.5, 1.0);
		// return vec4(normal * 0.5 + 0.5, 1.0);

		vec3 specular = vec3(0);
		vec3 diffuse = vec3(0);
		vec3 ambient = vec3(0);
		for (int i = 0; i < lightCount; i++) {
			Light light = lights[i];
			if (light.type == AMBIENT) {
				ambient += light.color;
			} else {
				vec3 lightDir = getLightDirection(position, light);
				vec3 color = getLightColor(position, light);
				color *= 1.0 - getShadow(position, light);
				if (material.specularExponent > 0.0)
					specular += color * pow(max(-dot(refl, lightDir), 0.0), material.specularExponent);
				diffuse += color * max(-dot(lightDir, normal), 0.0);
			}
		}
		
		vec3 albedoColor = MAYBE_TEXTURE(albedo, albedoTexture);
		vec3 specularColor = MAYBE_TEXTURE(specular, specularTexture); 
		vec3 light =	specularColor * specular +
						albedoColor * (diffuse + ambient) +
						material.emission;
		
		return vec4(light, material.alpha);
	}
`);