/**
 * @implements Copyable
 * Represents a material applied to a MeshChunk.
 * @prop String name | A optional name for the material. Materials loaded from files will use their file-provided names. Starts as "anonymous"
 * @prop Boolean transparent | Whether or not light can pass through the material
 */
class Material {
	constructor() {
		this.name = "anonymous";
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
	 * @prop String vertexShader? | The source code for the vertex shader. The default projects the vertex position and passes no additional information to the fragment shader
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
	get() {
		const result = new ShaderMaterial();
		result.fragmentShader = this.fragmentShader;
		result.vertexShader = this.vertexShader;
		Object.assign(result.uniforms, this.uniforms);
		return result;
	}
}
ShaderMaterial.DEFAULT_VERTEX_SHADER = `
	uniform float time; 

	vec3 shader() {
		return objectTransform * vec4(vertexPosition, 1);
	}
`;
ShaderMaterial.DEFAULT_FRAGMENT_SHADER = `
	vec4 shader() {
		return vec4(1);
	}
`;

/**
 * Represents a basic unlit solid-color material.
 * @prop Color color | The solid opaque color used everywhere on the material
 */
class ColorMaterial extends Material {
	/**
	 * Creates a new solid-color material.
	 * @param Color color | The color of the material. Must be opaque
	 */
	constructor(color) {
		super();

		this.color = color;
		this.vertexShader = ColorMaterial.VERTEX_SHADER;
		this.fragmentShader = ColorMaterial.FRAGMENT_SHADER;
		this.uniforms = { color: this.color };
		this.transparent = false;
	}
	get() {
		return new ColorMaterial(this.color.get());
	}
}

ColorMaterial.VERTEX_SHADER = new GLSL(ShaderMaterial.DEFAULT_VERTEX_SHADER);
ColorMaterial.FRAGMENT_SHADER = new GLSL(`
	uniform vec3 color;

	vec4 shader() {
		return vec4(color, 1);
	}
`);

/**
 * Represents a basic parameterized material based on the Blinn-Phong Shading Model.
 * @prop Color albedo | The base color of the material, against which ambient and diffuse lighting are calculated. Starts as white
 * @prop Color emission | The color of light emitted from the material. Starts as black
 * @prop Color specular | The color of specular highlights on the material. Starts as white
 * @prop ImageType/Sampler albedoTexture | The texture to use in in place of the `.albedo` color. It will be sampled according to the mesh's UVs
 * @prop ImageType/Sampler specularTexture | The texture to use in in place of the `.specular` color. It will be sampled according to the mesh's UVs
 * @prop Number specularExponent | The exponent applied during specular highlight calculation. Higher values correspond to sharper highlights. Starts as 0
 * @prop Number alpha | The non-zero opacity of the material. Starts as 1
 * @prop ImageType/Sampler alphaTexture | The texture whose alpha channel to use in place of the `.alpha` value. It will be sampled according to the mesh's UVs. Any material with a `.alphaTexture` is considered transparent
 */
class SimpleMaterial extends Material {
	/**
	 * Creates a new material based on certain surface settings.
	 * @param Object settings | An object where each entry corresponds to a property of SimpleMaterial
	 */
	constructor(settings = { }) {
		super();

		Color.defineReference(this, "albedo", Color.WHITE.get());
		Color.defineReference(this, "specular", Color.WHITE.get());
		Color.defineReference(this, "emission", Color.unlimited(0, 0, 0));
		this.specularExponent = 0;
		this.alpha = 1;
		
		this.vertexShader = SimpleMaterial.VERTEX_SHADER;
		this.fragmentShader = SimpleMaterial.FRAGMENT_SHADER;
		this.uniforms = { Material: this };
		this.useTexture = Vector3.zero;
		const textureSettings = ["albedoTexture", "specularTexture"];
		for (let i = 0; i < textureSettings.length; i++) {
			objectUtils.onChange(this, textureSettings[i], (key, value) => {
				if (value) {
					this.uniforms[key] = value;
				} else {
					this.uniforms[key] = null;
				}
				this.useTexture[SimpleMaterial.USE_TEXTURE[key]] = +!!value;
			});
		}

		objectUtils.onChange(this, "alphaTexture", (_, value) => {
			if (value) {
				this.uniforms.alphaTexture = value;
			} else {
				this.uniforms.alphaTexture = null;
			}
			this.useTexture[SimpleMaterial.USE_TEXTURE.alphaTexture] = +!!value;
		});
		this.albedoTexture = this.specularTexture = this.alphaTexture = null;

		Object.assign(this, settings);
	}
	/**
	 * Sets `.albedoTexture` and `.alphaTexture` to a given texture.
	 * @param ImageType/Sampler texture | The new color and alpha texture
	 */
	set colorTexture(a) {
		this.albedoTexture = this.alphaTexture = a;
	}
	/**
	 * Sets `.albedo` and `.alpha` to match a given color, and disables the current `.albedoTexture` and `.alphaTexture`.
	 * @param Color color | The new color value
	 */
	set color(a) {
		this.albedo.set(a.opaque);
		this.alpha = a.alpha;
		this.albedoTexture = this.alphaTexture = null;
	}
	get transparent() {
		return this.alpha < 1.0 || !!this.alphaTexture;
	}
	get() {
		const result = new SimpleMaterial();
		for (const key in this) {
			const value = this[key];
			if (value instanceof Color) {
				result[key] = value.get();
			} else {
				result[key] = value;
			}
		}
		return result;
	}

	static USE_TEXTURE = {
		albedoTexture: "x",
		specularTexture: "y",
		alphaTexture: "z"
	};
}
SimpleMaterial.VERTEX_SHADER = new GLSL(ShaderMaterial.DEFAULT_VERTEX_SHADER);
SimpleMaterial.LIGHTING = `
	struct Surface {
		vec3 albedo;
		vec3 specular;
		vec3 emission;
		float specularExponent;
	};

	vec3 bumpNormal(vec3 position, vec3 normal, float bump) {
		vec3 tangent = dFdx(position);
		vec3 bitangent = dFdy(position);
		return normalize(normal - (
			dFdx(bump) * tangent / dot(tangent, tangent) +
			dFdy(bump) * bitangent / dot(bitangent, bitangent)
		));
	}

	vec3 computeColor(vec3 position, vec3 normal, Surface surface) {
		vec3 diffuse = vec3(0);
		vec3 specular = vec3(0);
		vec3 ambient = vec3(0);
		
		vec3 view = normalize(position - lens.camera.position);
		vec3 refl = reflect(view, normal);

		for (int i = 0; i < lightCount; i++) {
			Light light = lights[i];
			if (light.type == AMBIENT) {
				ambient += light.color;
			} else {
				vec3 lightDir = getLightDirection(position, light);
				vec3 color = getLightColor(position, light);
				color *= 1.0 - getShadow(position, light);
				if (surface.specularExponent > 0.0)
					specular += color * pow(max(-dot(refl, lightDir), 0.0), surface.specularExponent);
				diffuse += color * max(-dot(lightDir, normal), 0.0);
			}
		}

		return	surface.specular * specular +
				surface.albedo * (diffuse + ambient) +
				surface.emission;
	}
`;

SimpleMaterial.FRAGMENT_SHADER = new GLSL(`
	uniform Material {
		vec3 albedo;
		vec3 specular;
		vec3 emission;
		float specularExponent;
		float alpha;
		bvec3 useTexture;
	} material;
		
	uniform sampler2D albedoTexture;
	uniform sampler2D specularTexture;
	uniform sampler2D alphaTexture;

	${SimpleMaterial.LIGHTING}

	vec4 shader() {
		vec3 albedoColor = material.useTexture.${SimpleMaterial.USE_TEXTURE.albedoTexture} ? texture(albedoTexture, uv).rgb : material.albedo;
		vec3 specularColor = material.useTexture.${SimpleMaterial.USE_TEXTURE.specularTexture} ? texture(specularTexture, uv).rgb : material.specular;

		Surface surface = Surface(albedoColor, specularColor, material.emission, material.specularExponent);
		vec3 light = computeColor(position, normal, surface);

		float alpha = material.useTexture.${SimpleMaterial.USE_TEXTURE.alphaTexture} ? texture(alphaTexture, uv).a : material.alpha;

		return vec4(light, alpha);
	}
`);