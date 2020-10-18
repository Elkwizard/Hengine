// Specify path for any component (Sounds, Sprites, Code, etc...) to get it from somewhere else.
const APPLICATION_PACKAGE = Hengine.defaultApplicationPackage(["LocalFiles", "ScriptList", "ContainerList", "Source"]);
APPLICATION_PACKAGE.sprites = {
	files: {
		".": [] // Put image names here
	}
};
/* Animation Representation */
/*
{
	folder: "MyAnimation", | Name of folder
	loops: false,          | Whether or not it loops
	delay: 2,              | Frame delay between each animation frame
	frames: 10             | Amount of frames in animation
}
*/
APPLICATION_PACKAGE.animations = {
	files: {
		".": [] // Put animations representations here
	}
};
APPLICATION_PACKAGE.sounds = {
	files: {
		".": [] // Put sound names here
	}
};
Hengine.load(APPLICATION_PACKAGE);