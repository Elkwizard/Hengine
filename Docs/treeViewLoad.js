// Specify path for any component (Sounds, Sprites, Code, etc...) to get it from somewhere else.
Hengine.load({
	"engine": {
		"files": {
			"Render": ["Color", "Shapes", "Animation", "Frame", "Texture", "Renderer", "Graph"],
			"Math": ["Vector", "Geometry", "Physics"],
			"Util": ["Input", "Sound", "Time", "Console"],
			"SceneObject": ["SceneObject", "SATPhysicsObject", "SpawnerObject", "UIObject"],
			"Manage": ["PrototypeOverload", "Scripts", "Scenes", "Engine", "Hengine"]
		}
	},
	"sounds": {
		"files": {
			".": ["Ding.mp3"]
		}
	},
	"sprites": {
		"path": "../../Docs",
		"files": {
			".": ["PR.png", "TL.png", "CS.png", "FN.png"]
		}
	},
	"animations": {
		"files": {
			".": [
				{
					"folder": "Chicken Flap",
					"frames": 4,
					"delay": 3,
					"loop": true
				}
			]
		}
	},
	"code": {
		"files": {
			".": ["../../Docs/DocOrg", "../../Docs/Documentation", "LocalFiles", "Script List", "Set List", "Source"]
		}
	}
});