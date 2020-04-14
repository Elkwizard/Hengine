// Specify path for any component (Sounds, Sprites, Code, etc...) to get it from somewhere else.
Hengine.load({
	"Engine": {
		"Files": {
			"Render": ["Color", "Shapes", "Animation", "Frame", "Fade", "Texture", "Renderer", "Graph"],
			"Math": ["Vector", "Geometry", "Physics"],
			"Util": ["Input", "Sound", "Time", "Console"],
			"SceneObject": ["SceneObject", "SATPhysicsObject", "SpawnerObject", "UIObject"],
			"Manage": ["PrototypeOverload", "Scripts", "Scenes", "Engine", "Hengine"]
		}
	},
	"Sounds": {
		"Files": {
			".": ["Ding.mp3"]
		}
	},
	"Sprites": {
		"Files": {
			".": ["Chicken.png"]
		}
	},
	"Animations": {
		"Files": {
			".": [
				{
					"Folder": "Chicken Flap",
					"Frames": 4,
					"Delay": 3,
					"Loop": true
				}
			]
		}
	},
	"Code": {
		"Files": {
			".": ["Script List", "Set List", "Source"]
		}
	}
});