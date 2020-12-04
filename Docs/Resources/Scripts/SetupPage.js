const DOCS = {
	"Structure": {
		"Hengine": {},
		"HengineLoader": {},
		"HengineResource": {
			"HengineResource": {},
			"HengineImageResource": {},
			"HengineAnimationResource": {},
			"HengineScriptResource": {}
		},
		"Intervals": {
			"IntervalFunction": {},
			"DelayedFunction": {},
			"TransitionFunction": {},
			"ContinuousFunction": {},
			"WaitUntilFunction": {},
			"IntervalManager": {}
		}
	},
	"Management": {
		"Scene": {},
		"ElementContainer": {},
	},
	"Superclasses": {
		"SceneObject": {},
		"Operable": {},
		"Lazy": {}
	},
	"Rendering": {
		"Image Types": {
			"ImageType": {},
			"Frame": {},
			"HImage": {},
			"Animation": {},
			"Texture": {},
			"WebcamCapture": {},
			"GPUShader": {},
			"GLSLError": {},
			"GraphPlane": {},
			"Graph": {}
		},
		"Font": {},
		"Renderer": {},
		"Camera": {},
		"Color": {},
		"Gradient": {},
		"GrayMap": {}
	},
	"Particles": {
		"ParticleSpawnerObject": {},
		"ParticleObject": {}
	},
	"Geometry": {
		"Shapes": {
			"Shape": {},
			"Polygon": {},
			"Rect": {},
			"Circle": {},
			"Line": {},
			"Spline": {}
		},
		"Range": {},
		"Vector": {},
		"Transform": {},
		"Geometry": {},
		"Interpolation": {}
	},
	"Physics": {
		"PhysicsEngine": {},
		"RigidBody": {},
		"PhysicsObject": {}
	},
	"Input": {
		"InputHandler": {},
		"KeyboardHandler": {},
		"MouseHandler": {},
		"ClipboardHandler": {},
	},
	"UI": {
		"UIComponent": {},
		"UIContainer": {},
		"UIObject": {}
	},
	"Scripts": {
		"ElementScript": {},
		"PLAYER_MOVEMENT": {},
		"DRAGGABLE": {},
		"TEXT_AREA": {}
	},
	"Miscellaneous": {
		"Time": {},
		"GPUComputation": {},
		"FileSystem": {},
		"Random": {},
		"Array": {}
	}
}
function getListHTML(name, obj) {
	let values = [];
	for (let key in obj) {
		values.push(key);
	}
	if (!values.length) return `<span class="nav-leaf">${getLink(name)}</span>`;
	else return `<div class="nav-section"><span class="nav-section-header">${name}</span><ul class="nav-section-list">${values.map(k => `<li class="nav-section-item">${getListHTML(k, obj[k])}</li>`).join("")}</ul></div>`;
}
document.getElementById("navigation").innerHTML = getListHTML("Navigation", DOCS);
loadPage("Font");