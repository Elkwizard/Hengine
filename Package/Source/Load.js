// Specify path (second argument in ApplicationPackageElement) for any component (Sounds, Sprites, Code, etc...) to get it from somewhere else.
const APPLICATION_PACKAGE = HengineLoader.defaultApplicationPackage(["LocalFiles", "ScriptList", "ContainerList", "Source"]);
APPLICATION_PACKAGE.sprites = new ApplicationPackageElement({
	".": [] // Put image names here
}, "../Art/Sprites");
/* Animation Representation */
/*
{
	folder: "MyAnimation", | Name of folder
	loops: false,          | Whether or not it loops
	delay: 2,              | Frame delay between each animation frame
	frames: 10             | Amount of frames in animation
}
*/
APPLICATION_PACKAGE.animations = new ApplicationPackageElement({
	".": [] // Put animations representations here
}, "../Art/Animations");
APPLICATION_PACKAGE.sounds = new ApplicationPackageElement({
	".": [] // Put sound names here
}, "../Sounds");
HengineLoader.load(APPLICATION_PACKAGE);