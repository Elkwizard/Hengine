declare interface Class<T> extends Function {
	new (...args: any[]): T;
}

type RemainingParams<T> = T extends (first: any, ...remaining: infer P) => any ? P : never;

type CanvasArtist = Artist3D;
type MatrixN = Matrix3;
type TransformMatrixN = Matrix4;
type VectorN = Vector3;
type CameraN = Camera3D;
type ArtistN = Artist3D;
type TransformN = Transform3D;
type BoxN = Prism;
type WorldObjectBallN = Sphere;
type WorldObjectPolytopeN = Polyhedron;
type InertiaN = Matrix3;
type AngleN = Vector3;

/**
 * Represents the way a canvas scales with changes to the window size.
 */
declare enum ScalingMode {
	/**
	 * The canvas changes size to fill the entire window
	 */
	STRETCH,
	/**
	 * The canvas will be the largest size that can fit in the window while still retaining the same aspect ratio
	 */
	PRESERVE_ASPECT_RATIO,
	/**
	 * Same as `ScalingMode.PRESERVE_ASPECT_RATIO`, except the scale factor on the size will always be in the form (n) or (1/n), where n is an integer
	 */
	INTEGER_MULTIPLE
}

/**
 * Represents the canvas on which the Hengine is rendered.
 * The pixel ratio of the canvas is equal to `window.devicePixelRatio`.
 * The `.width` and `.height` properties of this class are also available on the global object.
 * A vector with components equal to half the dimensions of the canvas is also available on the global object in the `.middle` property.
 * This class is available via the `.canvas` property of both the global object and Hengine.
 * ```js
 * canvas.scalingMode = ScalingMode.STRETCH;
 * 
 * intervals.continuous(() => { // render a circle to the middle of the screen
 * 	renderer.draw(new Color("blue")).circle(middle, 10);
 * });
 * ```
 */
declare class CanvasImage extends ImageType {
	/**
	 * A 2D or 3D renderer which can draw to the screen. WorldObjects will be drawn to this surface's World-Space
	 */
	renderer: CanvasArtist;
	/**
	 * A 2D renderer which targets a Screen-Space overlay on top of the canvas. Content on this will not be considered when this object is used as an ImageType
	 */
	ui: CanvasArtist2D;
	/**
	 * The cursor icon. This can be either an image or a CSS cursor name
	 */
	cursor: ImageType | string;
	/**
	 * The way in which the canvas scales when the window is resized. Starts as `ScalingMode.PRESERVE_ASPECT_RATIO`
	 */
	scalingMode: ScalingMode;
	/**
	 * The function that will be called to clear the screen each frame. Starts as `() => renderer.fill(new Color(255, 255, 255))`
	 */
	clearScreen: () => void;
}

/**
 * Represents a non-leaf node in the element tree, and can contain SceneObjects or additional ElementContainers.
 * All methods on this class that add SceneObjects only take effect at the end of the update cycle.
 */
declare class ElementContainer extends SceneElement {
	/**
	 * The default element script applied to all SceneObjects in the container upon creation
	 */
	defaultScript: Class<ElementScript>;
	/**
	 * Adds a new WorldObject with a single rectangle shape to the container.
	 * @param name - The name of the WorldObject. If this is not unique, it will be replaced with a similar but unique name
	 * @param x - The x coordinate of the center of the WorldObject
	 * @param y - The y coordinate of the center of the WorldObject
	 * @param width - The width of the rectangle shape
	 * @param height - The height of the rectangle shape
	 */
	addRectElement(name: string, x: number, y: number, width: number, height: number): WorldObject;
	/**
	 * Adds a new WorldObject with a single circle shape to the container.
	 * @param name - The name of the WorldObject. If this is not unique, it will be replaced with a similar but unique name
	 * @param x - The x coordinate of the center of the WorldObject
	 * @param y - The y coordinate of the center of the WorldObject
	 * @param radius - The radius of the circle shape
	 */
	addCircleElement(name: string, x: number, y: number, radius: number): WorldObject;
	/**
	 * Adds a new WorldObject to the container.
	 * @param name - The name of the WorldObject. If this is not unique, it will be replaced with a similar but unique name
	 * @param x - The x coordinate of the center of the WorldObject
	 * @param y - The y coordinate of the center of the WorldObject
	 */
	addElement(name: string, x: number, y: number): WorldObject;
	/**
	 * Adds a new WorldObject to the container. This WorldObject will have the PHYSICS script added.
	 * @param name - The name of the WorldObject. If this is not unique, it will be replaced with a similar but unique name
	 * @param x - The x coordinate of the center of the WorldObject
	 * @param y - The y coordinate of the center of the WorldObject
	 * @param dynamic - Whether the rigidbody should be physically dynamic. Default is false
	 */
	addPhysicsElement(name: string, x: number, y: number, dynamic?: boolean): WorldObject;
	/**
	 * Adds a new WorldObject with a single rectangle shape to the container. This WorldObject will have the PHYSICS script added.
	 * @param name - The name of the WorldObject. If this is not unique, it will be replaced with a similar but unique name
	 * @param x - The x coordinate of the center of the WorldObject
	 * @param y - The y coordinate of the center of the WorldObject
	 * @param width - The width of the rectangle shape
	 * @param height - The height of the rectangle shape
	 * @param dynamic - Whether the rigidbody should be physically dynamic. Default is false
	 */
	addPhysicsRectElement(name: string, x: number, y: number, width: number, height: number, dynamic?: boolean): WorldObject;
	/**
	 * Adds a new WorldObject with a single circle shape to the container. This WorldObject will have the PHYSICS script added.
	 * @param name - The name of the WorldObject. If this is not unique, it will be replaced with a similar but unique name
	 * @param x - The x coordinate of the center of the WorldObject
	 * @param y - The y coordinate of the center of the WorldObject
	 * @param radius - The radius of the circle shape
	 * @param dynamic - Whether the rigidbody should be physically dynamic. Default is false
	 */
	addPhysicsCircleElement(name: string, x: number, y: number, radius: number, dynamic?: boolean): WorldObject;
	/**
	 * Adds a new UIObject with a single rectangle shape to the container.
	 * @param name - The name of the UIObject. If this is not unique, it will be replaced with a similar but unique name
	 * @param x - The x coordinate of the center of the UIObject
	 * @param y - The y coordinate of the center of the UIObject
	 * @param width - The width of the rectangle shape
	 * @param height - The height of the rectangle shape
	 */
	addUIElement(name: string, x: number, y: number, width: number, height: number): UIObject;
	/**
	 * Adds a new ElementContainer to the container.
	 * @param name - The name of the new container. If this is not unique, it will be replaced with a similar but unique name
	 */
	addContainer(name: string): this;
	/**
	 * Removes a collection of elements from the container
	 * @param elements - The elements to remove from the container
	 */
	removeElements(elements: SceneElement[]): void;
	/**
	 * Removes all the elements from the container.
	 */
	removeAllElements(): void;
	/**
	 * Retrieves an element from the container by name, or returns null if no such element exists.
	 * @param name - The name of the SceneElement to retrieve
	 */
	get(name: string): SceneElement;
	/**
	 * Retrieves an element (or multiple) based on a piece of identifying information.
	 * @param name - The name of a scene element. Returns that element or null if no element exists with that name
	 */
	query(name: string): SceneElement | SceneElement[];
	/**
	 * Retrieves an element (or multiple) based on a piece of identifying information.
	 * @param script - The ElementScript to select for. Returns all elements with an instance of this script
	 */
	query(script: Class<ElementScript>): SceneElement | SceneElement[];
	/**
	 * Retrieves an element (or multiple) based on a piece of identifying information.
	 * @param mask - A pure function selecting for certain elements. Returns all elements that return true when passed to this function.
	 */
	query(mask: (arg0: SceneElement) => boolean): SceneElement | SceneElement[];
	/**
	 * Retrieves an element (or multiple) based on a piece of identifying information.
	 */
	query(): SceneElement | SceneElement[];
	/**
	 * Returns all of the leaf nodes within the container.
	 */
	getAllElements(): SceneObject[];
	/**
	 * Returns a conditional subset of all the leaf nodes within the container. 
	 * @param mask - The function used to check which elements should be returned
	 */
	getElementsMatch(mask: (arg0: SceneObject) => boolean): SceneObject[];
	/**
	 * Returns all of the UIObject leaf nodes within the container.
	 */
	getUIElements(): UIObject[];
	/**
	 * Returns all of the on-screen leaf nodes within the container.
	 */
	getOnScreenElements(): SceneObject[];
	/**
	 * Returns all of the leaf nodes within the container that have a specific ElementScript.
	 * @param script - The class of the ElementScript to check for
	 */
	getElementsWithScript(script: Class<ElementScript>): SceneObject[];
}

/**
 * Represents the engine itself. Contains all the main functionality in its properties.
 * All properties of this class are available as properties of the global object. 
 */
declare class Hengine {
	/**
	 * The keyboard API
	 */
	keyboard: KeyboardHandler;
	/**
	 * The mouse API
	 */
	mouse: MouseHandler;
	/**
	 * The touch screen API
	 */
	touches: TouchHandler;
	/**
	 * The clipboard API
	 */
	clipboard: ClipboardHandler;
	/**
	 * The canvas associated with the engine
	 */
	canvas: CanvasImage;
	/**
	 * The 2D or 3D renderer associated with the canvas. Draws directly on the screen
	 */
	renderer: CanvasArtist;
	/**
	 * The 2D Screen-Space overlay renderer associated with the canvas. Draws directly on the screen
	 */
	ui: CanvasArtist2D;
	/**
	 * The scene containing all the objects currently in the engine
	 */
	scene: Scene;
	/**
	 * The interval manager managing the update loop of the engine
	 */
	intervals: IntervalManager;
	/**
	 * The file system for the engine. This property persists across reloads and different sessions via `localStorage`
	 */
	fileSystem: Files;
	/**
	 * Destroys the engine instance and removes the canvas.
	 */
	end(): void;
}

/**
 * Represents an external resource to be loaded by the Hengine.
 * ```js
 * HengineLoader.load([
 * 	new HengineImageResource("cat.png"),
 * 	new HengineImageResource("dog.png"),
 * 	new HengineScriptResource("renderers/catRenderer.js"),
 * 	new HengineScriptResource("renderers/dogRenderer.js"),
 * 	new HengineScriptResource("index.js")
 * ]);
 * ```
 */
declare class HengineResource {
	/**
	 * The path to the resource
	 */
	src: string;
	/**
	 * Begins the loading of the resource, and returns a Promise. The Promise resolves to the final resource value when the loading is completed, or null if it fails.
	 */
	load(): Promise;
}

/**
 * Represents an external script to be loaded.
 * When this resource loads, it will run the loaded script and resolve to the HTMLScriptElement.
 */
declare class HengineScriptResource extends HengineResource {
	
}

/**
 * Represents an external sound to be loaded.
 * When this resource loads, it will resolve to a Sound.
 */
declare class HengineSoundResource extends HengineResource {
	/**
	 * Whether or not the sound loops after completing
	 */
	loops: boolean;
	/**
	 * Creates a new HengineSoundResource.
	 * @param src - The path to the sound
	 * @param loops - Whether or not the sound loops
	 */
	constructor(src: string, loops: boolean);
}

/**
 * Represents an external image to be loaded.
 * When this resource loads, it will resolve to an HImage.
 */
declare class HengineImageResource extends HengineResource {
	
}

/**
 * Represents an external video to be loaded.
 * When this resource loads, it will resolve to a VideoView.
 */
declare class HengineVideoResource extends HengineResource {
	/**
	 * Whether or not the video loops after completing
	 */
	loops: boolean;
	/**
	 * Creates a new HengineVideoResource.
	 * @param src - The path to the video
	 * @param loops - Whether or not the video loops
	 */
	constructor(src: string, loops: boolean);
}

/**
 * Represents an external animation to be loaded.
 * When this resource loads, it will resolve to an Animation.
 */
declare class HengineAnimationResource extends HengineResource {
	/**
	 * The path to a folder containing all the animation frames, named `1.png` to `n.png`
	 */
	src: string;
	/**
	 * The number of frames in the animation
	 */
	frames: number;
	/**
	 * The number of runtime frames to display each frame for
	 */
	delay: number;
	/**
	 * Whether or not the animation loops after completing
	 */
	loops: boolean;
	/**
	 * Creates a new HengineAnimationResource.
	 * @param src - The path to a folder containing the animation frames
	 * @param frames - The number of frames in the animation
	 * @param delay - The number of runtime frames to display each frame for
	 * @param loops - Whether or not the animation loops
	 */
	constructor(src: string, frames: number, delay: number, loops: boolean);
}

/**
 * Represents an external Font to be loaded.
 * When this resource loads, it will resolve to the name of the font family.
 */
declare class HengineFontResource extends HengineResource {
	/**
	 * The path to a CSS stylesheet containing the @font-face rule(s).
	 */
	src: string;
}

/**
 * Represents an external text file to be loaded.
 * When this resource is loaded, it resolves to the text content of the file.
 */
declare class HengineTextResource extends HengineResource {
	
}

/**
 * Represents an external binary file to be loaded.
 * When this resource is loaded, it resolves to a ByteBuffer containing the file content, with the pointer at 0.
 */
declare class HengineBinaryResource extends HengineResource {
	
}

/**
 * Represents a request for access to the user's webcam.
 * When this resource is loaded, it resolves to a WebcamCapture that is actively streaming.
 */
declare class HengineWebcamResource extends HengineResource {
	/**
	 * Creates a new HengineWebcamResource.
	 * @param name - A unique identifier for the webcam. This can be passed to `loadResource()` to retrieve it once loaded
	 */
	constructor(name: string);
}

/**
 * Represents an external material file to be loaded.
 * When this resource is loaded, it resolves to a Map from material names to Material objects.
 * This resource supports loading `.mtl` files.
 */
declare class HengineMaterialResource extends HengineResource {
	
}

/**
 * Represents an external 3D mesh file to be loaded.
 * When this resource is loaded, it resolves to a Map from object names to Meshes.
 * This resource supports loading `.obj` files.
 */
declare class HengineMeshResource extends HengineResource {
	
}

/**
 * Represents a batch of HengineResources to be loaded in a row, and can be used as a more streamlined approach compared to constructing HengineResources directly.
 * It contains an internal list of resources to load, and many of its methods simply add to this list, which can eventually be flushed and loaded, though only once per instance.
 * These methods also return the caller, which allows for convenient chaining.
 * ```js
 * new HengineLoadingStructure()
 * 	.image("cat.png")
 * 	.image("dog.png")
 * 	.folder("renderers", structure => structure
 * 		.script("catRenderer.js")
 * 		.script("dogRenderer.js")
 * 	)
 * 	.script("index.js")
 * 	.load()
 * ```
 */
declare class HengineLoadingStructure {
	/**
	 * Loads all the queued resources, and returns the HengineLoader instance that contains them.
	 * @param done - Whether or not the HengineLoader should start the update loop after these resources finish loading
	 */
	load(done: boolean): HengineLoader;
	/**
	 * Adds all the queued resources from another HengineLoadingStructure to the caller's queue.
	 * Returns the caller.
	 * @param structure - The structure to get the queue from
	 */
	from(structure: this): this;
	/**
	 * Puts the loading structure in the context of a specified folder, calls a specific function, and then exits the context.
	 * Calls to this function while inside a call to this function will stack the contexts together, allowing nesting of folder scopes.
	 * Returns the caller.
	 * @param path - The relative path to the folder to add to the context stack
	 * @param fn - The function to call while in the context. This function is passed the caller as an argument
	 */
	folder(path: string, fn: (arg0: this) => void): this;
	/**
	 * Adds a HengineScriptResource to the queue with a specified source.
	 * @param src - The path to the resource
	 */
	script(src: string): this;
	/**
	 * Adds a HengineBinaryResource to the queue with a specified source.
	 * @param src - The path to the resource
	 */
	binary(src: string): this;
	/**
	 * Adds a HengineWebcamResource to the queue with a specified name.
	 * @param name - The name of the resource
	 */
	webcam(name: string): this;
	/**
	 * Adds a HengineTextResource to the queue with a specified source.
	 * @param src - The path to the resource
	 */
	text(src: string): this;
	/**
	 * Adds a HengineImageResource to the queue with a specified source.
	 * @param src - The path to the resource
	 */
	image(src: string): this;
	/**
	 * Adds a HengineFontResource to the queue with a specified source.
	 * @param src - The path to the resource
	 */
	font(src: string): this;
	/**
	 * Adds a HengineAnimationResource to the queue with a specified source.
	 * @param src - The path to the resource
	 * @param options - An object containing `.frames`, `.delay`, and `.loops` properties that will be passed to the HengineAnimationResource constructor. These values have defaults of 1, 1, and true, respectively
	 */
	animation(src: string, options?: { frames?: number, delay?: number, loops?: boolean }): this;
	/**
	 * Adds a HengineVideoResource to the queue with a specified source.
	 * @param src - The path to the resource
	 * @param options - An object containing a `.loops` properties that will be passed to the HengineVideoResource constructor. The default value is false
	 */
	video(src: string, options?: { loops?: boolean }): this;
	/**
	 * Adds a HengineSoundResource to the queue with a specified source.
	 * @param src - The path to the resource
	 * @param options - An object containing a `.loops` properties that will be passed to the HengineSoundResource constructor. The default value is false
	 */
	sound(src: string, options?: { loops?: boolean }): this;
	/**
	 * Adds a HengineMeshResource to the queue with a specified source.
	 * @param src - The path to the resource
	 */
	mesh(src: string): this;
	/**
	 * Adds a HengineMaterialResource to the queue with a specified source.
	 * @param src - The path to the resource
	 */
	material(src: string): this;
}

/**
 * Allows for the loading of both the rest of the Hengine and additional external files.
 * The file containing this class `HengineLoader.js` is the only file that needs to be loaded directly to use the Hengine.
 * Other files can be loaded via the HengineLoader's API.
 * The web url for this file is:
 * ```url
 * https://elkwizard.github.io/Hengine/Package/Engine/Manage/HengineLoader.js
 * ```
 * This class is a singleton, and the single instance can be accessed via a static property.
 * ```js
 * async function load() {
 * 	// choose which file to load based on an external file
 * 	await HengineLoader.load([
 * 		new HengineTextResource("whichToLoad.txt")
 * 	], false);
 * 
 * 	// load the selected script
 * 	const fileName = loadResource("whichToLoad.txt");
 * 	await HengineLoader.load([
 * 		new HengineScriptResource(`${fileName}.js`)
 * 	]);
 * }
 * ```
 */
declare class HengineLoader {
	/**
	 * The singleton instance
	 */
	static loader: HengineLoader;
	/**
	 * Retrieves a specific resource.
	 * If the resource failed to load, this returns null.
	 * This method is also available on the global object.
	 * If the resource implements Copyable, a copy of the resource will be returned.
	 * @param src - An arbitrarily-lengthed tail end of the source of the resource. This can be as few characters as are needed to be unambiguous, or may be the entire path
	 */
	loadResource(src: string): any | null;
	/**
	 * Loads a series of resources, and optionally starts the update loop after the loading completes.
	 * If the rest of the Hengine has yet to be loaded, it will be loaded before any of the resources passed to this function.
	 * Returns a promise that resolves to the HengineLoader instance when all the resources are loaded.
	 * @param userResources - The resources to load
	 * @param done - Whether or not the update loop should start after the resources are loaded. Default is true
	 */
	static load(userResources: HengineResource[], done?: boolean): Promise;
}

/**
 * The keyboard input API for the Hengine
 */
declare const keyboard: KeyboardHandler;

/**
 * The mouse input API for the Hengine
 */
declare const mouse: MouseHandler;

/**
 * The touchscreen input API for the Hengine
 */
declare const touches: TouchHandler;

/**
 * The clipboard I/O API for the Hengine
 */
declare const clipboard: ClipboardHandler;

/**
 * The canvas on which rendering occurs
 */
declare const canvas: CanvasImage;

/**
 * The 2D or 3D renderer that affects the screen
 */
declare const renderer: CanvasArtist;

/**
 * The 2D Screen-Space overlay renderer that affects the screen
 */
declare const ui: CanvasArtist2D;

/**
 * The scene that contains all SceneElements
 */
declare const scene: Scene;

/**
 * The timing and scheduling API for the Hengine
 */
declare const intervals: IntervalManager;

/**
 * The built-in, localStorage-based file system API
 */
declare const fileSystem: Files;

/**
 * The coordinates of the center of the screen, in screen space
 */
declare const middle: Vector2;

/**
 * The width of the screen
 */
declare const width: number;

/**
 * The height of the screen
 */
declare const height: number;

/**
 * The name of the current browser tab
 */
declare const title: string;

/**
 * Retrieves a specific resource.
 * If the resource failed to load, this returns null.
 * This method is also available on the global object.
 * If the resource has internal mutable state, like an Animation, a new copy of the resource will be returned with each call to this function.
 * @param src - An arbitrarily-lengthed tail end of the source of the resource. This can be as few characters as are needed to be unambiguous, or may be the entire path
 */
declare function loadResource(src: string): any | null;

/**
 * A wrapper for operations that happen over time or after a time.
 * These can generally be created by methods of IntervalManager.
 * ```js
 * const transitionDone = intervals.transition(t => {
 * 	console.log("Progress: " + t);
 * }, 5);
 * 
 * transitionDone.then(() => {
 * 	console.log("The transition has completed");
 * });
 * 
 * // Progress: 0
 * // Progress: 0.2
 * // Progress: 0.4
 * // Progress: 0.6
 * // Progress: 0.8
 * // Progress: 1
 * // The transition has completed
 * ```
 */
declare class IntervalFunction {
	/**
	 * The function to call during the operation
	 */
	fn: Function;
	/**
	 * When during the update cycle the function updates
	 */
	type: symbol;
	/**
	 * A promise which resolves when the operation completes
	 */
	promise: Promise;
	/**
	 * Indicates whether the operation has completed
	 */
	done: boolean;
	/**
	 * The amount of frames the IntervalFunction has existed for
	 */
	timer: number;
	/**
	 * The total duration of the operation. The operation will complete after the timer exceeds this value
	 */
	interval: number;
	/**
	 * This symbol indicates that the operation should take place before the screen is cleared
	 */
	static BEFORE_UPDATE: symbol;
	/**
	 * This symbol indicates that the operation should take place immediately before the main engine update
	 */
	static UPDATE: symbol;
	/**
	 * This symbol indicates that the operation should take place immediately after the main engine update
	 */
	static AFTER_UPDATE: symbol;
}

/**
 * This IntervalFunction executes an operation once after a specified delay.
 */
declare class DelayedFunction extends IntervalFunction {
	
}

/**
 * This IntervalFunction executes an operation every frame over a duration and is passed a completion percentage.
 */
declare class TransitionFunction extends IntervalFunction {
	
}

/**
 * This IntervalFunction executes an operation once every frame forever.
 */
declare class ContinuousFunction extends IntervalFunction {
	
}

/**
 * This IntervalFunction executes an operation once after a provided condition is met.
 * After the condition is met, the WaitUntilFunction finishes.
 */
declare class WaitUntilFunction extends IntervalFunction {
	
}

/**
 * Manages the update loop of the Hengine.
 * This class is available via the `.intervals` property of the global object.
 * ```js
 * // display FPS data
 * intervals.continuous(() => {
 * 	renderer.image(intervals.fpsGraph).default(10, 10);
 * });
 * ```
 */
declare class IntervalManager {
	/**
	 * The FPS based only on the duration of the last frame. This value is read-only
	 */
	rawFps: number;
	/**
	 * The current target/maximum amount of update cycles per second
	 */
	targetFPS: number;
	/**
	 * A graph of the FPS for the last 400 frames. This value is read-only
	 */
	fpsGraph: GraphPlane;
	/**
	 * The total number of frames that have elapsed thusfar. This value is read-only
	 */
	frameCount: number;
	/**
	 * Whether or not the interval manager should collect performance data (`.fps`, `.fpsGraph`, etc.)
	 */
	performanceData: boolean;
	/**
	 * Sets the target/maximum update cycles per second.
	 * @param fps - The new target FPS
	 */
	set fps(fps: number);
	/**
	 * Returns the current number of update cycles per second.
	 */
	get fps(): number;
	/**
	 * Returns whether or not the update loop is currently paused.
	 */
	get paused(): boolean;
	/**
	 * Creates a new GraphPlane.
	 * @param graphs - The graphs to display on the plane
	 * @param frameLimit - The number of frames to be graphed at once. Default is 400
	 */
	makeGraphPlane(graphs: Graph[], frameLimit?: number): GraphPlane;
	/**
	 * Stops the update loop.
	 */
	pause(): void;
	/**
	 * Resumes the update loop if this function has been called as many times as `.pause()`.
	 */
	play(): void;
	/**
	 * Creates a new ContinuousFunction.
	 * @param fn - The function to be executed every frame. This function will be passed the number of frames since it started being called
	 * @param type - When during the update cycle to execute the function. Default is `IntervalFunction.AFTER_UPDATE`
	 */
	continuous(fn: (arg0: number) => void, type?: symbol): void;
	/**
	 * Creates a new TransitionFunction. Returns a promise that resolves when the transition completes.
	 * @param fn - The function to execute over the duration. This function will be passed the completion proportion
	 * @param frames - The duration of the transition
	 * @param type - When during the update cycle to execute the function. Default is `IntervalFunction.BEFORE_UPDATE`
	 */
	transition(fn: (arg0: number) => void, frames: number, type: symbol): Promise;
	/**
	 * Animates the value of a Operable or Number property from its current value to another over a specified interval.
	 * Returns a promise that resolves when the animation completes.
	 * @param object - The object which has the animated property
	 * @param property - The key of the animated property
	 * @param finalValue - The value to animate to
	 * @param duration - The duration of the animation
	 * @param curve - The easing function. Default is `Interpolation.linear`
	 * @param type - When during the update cycle to update the animation. Default is `IntervalFunction.BEFORE_UPDATE`
	 */
	animate(object: object, property: string | symbol, finalValue: Operable, duration: number, curve?: (arg0: number) => number, type?: symbol): Promise;
	/**
	 * Creates a new DelayedFunction.
	 * Returns a promise that resolves when the function executes.
	 * @param fn - The function to execute after the delay
	 * @param frames - The length of the delay
	 * @param type - When during the update cycle to execute the function. Default is `IntervalFunction.BEFORE_UPDATE`
	 */
	delay(fn: () => void, frames: number, type: symbol): Promise;
	/**
	 * Creates a new WaitUntilFunction.
	 * Returns a promise that resolves when the function executes.
	 * @param fn - The function to execute when the event occurs
	 * @param event - The event function. When this function returns true, the function will execute
	 * @param type - When during the update cycle to execute the function. Default is `IntervalFunction.BEFORE_UPDATE`
	 */
	waitUntil(fn: () => void, event: () => boolean, type: symbol): Promise;
}

/**
 * Instantly crashes the engine and logs something to the console.
 * @param messages - Data to be logged
 */
declare function exit(...messages: any[]): void;

/**
 * Manages the creation, persistence, and deletion of SceneObjects in the Hengine.
 * It also manages the physics engine.
 * This class should not be constructed, and can be accessed via the `.scene` property of both the global object and Hengine.
 * ```js
 * scene.gravity = new Vector2(0, 0.1); // low gravity
 * const floor = scene.main.addPhysicsRectElement("floor", width / 2, height, width, 50);
 * 
 * const BLOCK_SIZE = 30;
 * for (let i = 0; i < 10; i++) // generate 10 slightly disorganized blocks that will fall
 * 	scene.main.addPhysicsRectElement(
 * 		"block",
 * 		width / 2 + Random.range(-10, 10),
 * 		floor.getBoundingBox().y - (i + 0.5) * BLOCK_SIZE,
 * 		BLOCK_SIZE, BLOCK_SIZE, true
 * 	);
 * ```
 */
declare class Scene {
	/**
	 * The root of the element tree for the scene
	 */
	main: ElementContainer;
	/**
	 * The camera used to render the scene
	 */
	camera: CameraN;
	/**
	 * Whether or not mouse events will ever be checked. If this is true, specific SceneObjects can opt out, but not vice-versa
	 */
	mouseEvents: boolean;
	/**
	 * Whether or not SceneObject graphics will ever be culled. If this is true, specific SceneObjects can still opt out, but not vice-versa
	 */
	cullGraphics: boolean;
	/**
	 * Whether or not collision events will be detected
	 */
	collisionEvents: boolean;
	/**
	 * Whether the scene is in the process of updating the SceneObjects
	 */
	updating: boolean;
	/**
	 * A list of all of the objects most recently rendered, in the order they were rendered in. This updates prior to rendering each frame. This property is read-only.
	 */
	renderOrder: SceneObject[];
	/**
	 * Sets the gravitational acceleration for the physics engine.
	 * @param gravity - The new gravitational acceleration
	 */
	set gravity(gravity: VectorN);
	/**
	 * Returns the current gravitational acceleration for the physics engine.
	 * This is initially `VectorN.y(0.4)`.
	 */
	get gravity(): VectorN;
	/**
	 * Returns all the active constraints in the scene.
	 */
	get constraints(): Constraint[];
	/**
	 * Performs a ray-cast against some or all of the WorldObjects in the scene.
	 * If the ray-cast fails, then null is returned.
	 * Otherwise returns an object with a `.hitShape` property specifying which WorldObject was hit, and a `.hitPoint` property containing the point of intersection between the ray and the WorldObject.
	 * @param rayOrigin - The origin point of the ray
	 * @param rayDirection - The unit vector direction of the ray
	 * @param mask - A filter for which WorldObjects should be considered in the ray-cast. Default is `(object) => true`
	 */
	rayCast(rayOrigin: VectorN, rayDirection: VectorN, mask?: (arg0: WorldObject) => boolean): { hitShape: WorldObject, hitPoint: VectorN } | null;
	/**
	 * Returns a list of all the WorldObjects that contain a specific World-Space point.
	 * @param point - The World-Space point to check
	 */
	collidePoint(point: VectorN): WorldObject[];
	/**
	 * Creates a physical constraint that forces the distance between two points on two objects to remain constant.
	 * @param a - The first object to constrain. Must have the PHYSICS script
	 * @param b - The second object to constrain. Must have the PHYSICS script
	 * @param aOffset - The local a-space point where the constraint will attach to the first object. Default is no offset
	 * @param bOffset - The local b-space point where the constraint will attach to the second object. Default is no offset
	 * @param length - The distance to enforce between the two points. Default is the current distance between the constrained points
	 */
	constrainLength(a: WorldObject, b: WorldObject, aOffset?: VectorN, bOffset?: VectorN, length?: number): Constraint2;
	/**
	 * Creates a physical constraint that forces the distance between a point on an object and a fixed point to remain constant.
	 * @param object - The object to constrain. Must have the PHYSICS script
	 * @param offset - The local object-space point where the constraint will attach to the object. Default is no offset
	 * @param point - The location to constrain the length to. Default is the current location of the constrained point
	 * @param length - The distance to enforce between the two points. Default is the current distance between the constrained points
	 */
	constrainLengthToPoint(object: WorldObject, offset?: VectorN, point?: VectorN, length?: number): Constraint1;
	/**
	 * Creates a physical constraint that forces two points on two objects to be in the same location.
	 * @param a - The first object to constrain. Must have the PHYSICS script
	 * @param b - The second object to constrain. Must have the PHYSICS script
	 * @param aOffset - The local a-space point where the constraint will attach to the first object. Default is no offset
	 * @param bOffset - The local b-space point where the constraint will attach to the second object. Default is no offset
	 */
	constrainPosition(a: WorldObject, b: WorldObject, aOffset?: VectorN, bOffset?: VectorN): Constraint2;
	/**
	 * Creates a physical constraint that forces the a point on an object and a fixed point to remain in the same location.
	 * @param object - The object to constrain. Must have the PHYSICS script
	 * @param offset - The local object-space point where the constraint will attach to the object. Default is no offset
	 * @param point - The location to constrain the length to. Default is the current location of the constrained point
	 */
	constrainPositionToPoint(object: WorldObject, offset?: VectorN, point?: VectorN): Constraint1;
}

/**
 * Represents the way in which dimensions are prioritized in `Geometry.gridToRects()`.
 */
declare enum RectPriority {
	/**
	 * The rectangles should be approximately square, with a difference in dimensions of at most one tile
	 */
	SQUARE,
	/**
	 * The rectangles should become as wide as possible, and then grow vertically
	 */
	HORIZONTAL,
	/**
	 * The rectangles should become as tall as possible, and then grow horizontally
	 */
	VERTICAL
}

/**
 * Provides a collection of 2D geometric algorithms that operate on shapes and vectors.
 * All methods of this class are static and do not mutate their arguments.
 */
declare class Geometry {
	/**
	 * Applies a single smoothing step to a connected sequence of line segments.
	 * @param path - The path to be smoothed
	 */
	static smoothConnector(path: Vector2[]): Vector2[];
	/**
	 * Applies a single smoothing step to a polygon.
	 * @param shape - The shape to be smoothed
	 */
	static smoothPolygon(shape: Polygon): Polygon;
	/**
	 * Simplifies a polygon by removing a specified proportion of the vertices.
	 * @param polygon - The polygon to simplify
	 * @param percent - The percentage of vertices to remove
	 */
	static simplify(polygon: Polygon, percent: number): Polygon;
	/**
	 * Inflates a polygon along its normals by a specified distance.
	 * @param polygon - The polygon to inflate
	 * @param distance - The distance to extrude by
	 */
	static inflate(polygon: Polygon, distance: number): Polygon;
	/**
	 * Simplifies a polygon by combining adjacent edges that are nearly colinear. 
	 * @param polygon - The polygon to simplify
	 * @param dtheta - The maximum angular difference in direction between two consecutive edges where they will be combined
	 */
	static joinEdges(polygon: Polygon, dtheta: number): Polygon;
	/**
	 * Creates a triangular decomposition of the provided convex polygon.
	 * The triangles are returned as arrays of three vectors. 
	 * @param shape - The convex polygon to decompose
	 */
	static triangulate(shape: Polygon): Vector2[][];
	/**
	 * Checks whether a list of points are in clockwise order.
	 * @param vertices - The points to check
	 */
	static isListClockwise(vertices: Vector2[]): boolean;
	/**
	 * Combines a set of grid-aligned squares into the minimum number of rectangles occupying the same space.
	 * These are then scaled by a certain factor about the origin of the grid.
	 * @param srcGrid - A grid of booleans representing the squares. The first index of the boolean is the x coordinate, the second index is the y, and the value of the boolean determines whether or not a square exists in that space
	 * @param cellSize - The factor to scale the result by
	 * @param priority - How the dimensions of the rectangles should be prioritized in the greedy algorithm. Default is `RectPriority.SQUARE`
	 */
	static gridToRects(srcGrid: boolean[][], cellSize: number, priority?: RectPriority): Rect[];
	/**
	 * Combines a set of grid-aligned squares into the minimum number of polygons occupying the same space.
	 * These are then scaled by a certain factor about the origin of the grid. Holes within groups of squares will be removed.
	 * @param srcGrid - A grid of booleans representing the squares. The first index of the boolean is the x coordinate, the second index is the y, and the value of the boolean determines whether or not a square exists in that space
	 * @param cellSize - The factor to scale the result by
	 */
	static gridToExactPolygons(srcGrid: boolean[][], cellSize: number): Polygon[];
	/**
	 * Same as `.gridToExactPolygons()`, except that the returned Polygons have their concave vertices removed. Note that this filtering step only happens once, so the result may have still have concave vertices.
	 * @param srcGrid - A boolean grid representing the squares
	 * @param cellSize - The factor to scale the result by
	 */
	static gridToPolygons(srcGrid: boolean[][], cellSize: number): Polygon[];
	/**
	 * Finds the closest point from a list of points to a given point.
	 * @param target - The point distances are checked from
	 * @param points - The points to compare
	 */
	static closest(target: Vector, points: Vector[]): Vector;
	/**
	 * Finds the farthest point from a list of points to a given point.
	 * @param target - The point distances are checked from
	 * @param points - The points to compare
	 */
	static farthest(target: Vector, points: Vector[]): Vector;
	/**
	 * Normalizes an angle to be on the interval [0, 2π).
	 * @param theta - The angle to normalize
	 */
	static normalizeAngle(theta: number): number;
	/**
	 * Finds the shortest angular displacement between two angles.
	 * @param a - The first angle
	 * @param b - The second angle
	 */
	static signedAngularDist(a: number, b: number): number;
	/**
	 * Returns the closest intersection of a ray with a collection of shapes.
	 * The return value is either null (if the ray-cast misses) or an object with two properties:
	 * a `.hitPoint` property containing the location of the ray intersection, and a `.hitShape` property containing the shape that the ray intersected. 
	 * The dimensionality of the ray specification and the shapes must match, but this function will work for both Vector2/Shape2D and Vector3/Shape3D configurations.
	 * @param rayOrigin - The starting point of the ray
	 * @param rayDirection - The direction of the ray
	 * @param shapes - The Shapes to ray-cast against
	 */
	static rayCast(rayOrigin: Vector, rayDirection: Vector, shapes: Shape[]): { hitShape: Shape, hitPoint: Vector } | null;
	/**
	 * Decomposes any polygon into a collection of convex polygons that occupy the same space.
	 * @param polygon - The polygon to subdivide
	 */
	static subdividePolygon(polygon: Polygon): Polygon[];
	/**
	 * Returns the point of intersection between a line segment and a ray, or null if they don't intersect
	 * @param rayOrigin - The origin of the ray
	 * @param rayDirection - The direction of the ray
	 * @param line - The line
	 */
	static intersectRayLine(rayOrigin: Vector2, rayDirection: Vector2, line: Line): Vector2 | null;
	/**
	 * Returns the point of intersection between two line segments, or null if they don't intersect
	 * @param a - The first line
	 * @param b - The second line
	 */
	static intersectLineLine(a: Line, b: Line): Vector2 | null;
	/**
	 * Returns the region of intersection between two convex polygons, or null if they don't intersect.
	 * @param a - The first polygon
	 * @param b - The second polygon
	 */
	static intersectPolygonPolygon(a: Polygon, b: Polygon): Polygon | null;
}

/**
 * Represents a GLSL operation that can be run in parallel on the GPU.
 * The entry point for the GLSL operation is the `compute` function, which returns any struct type and takes no arguments.
 * ```glsl
 * SomeStruct compute() { ... }
 * ```
 * The returned value is considered the output of the operation, and some global variables are provided as the input:
 * ```glsl
 * uniform int problems; // the total number of operations in the current batch
 * int problemIndex; // the index of the current operation in the batch
 * ```
 * Commonly, one or more dynamic array uniforms can be used to store complex input data, as shown in the following example.
 * ```js
 * // computation to move circles toward the middle of the screen
 * const computation = new GPUComputation(`
 * 	struct Circle {
 * 		vec2 position;
 * 		float radius;
 * 	};
 * 
 * 	uniform Circle[] circles;
 * 	uniform vec2 middle;
 * 
 * 	Circle compute() {
 * 		Circle circle = circles[problemIndex];
 * 		circle.position = mix(circle.position, middle, 0.01);
 * 		return circle;
 * 	}
 * `);
 * 
 * const circles = Array.dim(1000).map(() => {
 * 	return { position: Random.inShape(scene.camera.screen), radius: 10 };
 * });
 * 
 * // write, compute, and readback circle data
 * computation.setUniforms({ circles, middle });
 * computation.compute(circles.length);
 * computation.output.read(circles);
 * ```
 */
declare class GPUComputation implements GPUInterface {
	/**
	 * An array storing the output of the most recent batch of operations
	 */
	output: GPUArray;
	/**
	 * Runs a batch of operations.
	 * @param problems - The number of operations to run
	 */
	compute(problems: number): void;
	/**
	 * The source code of the program
	 */
	glsl: string;
	/**
	 * Sets the value of a uniform in the program.
	 * @param name - The name of the uniform
	 * @param value - The new value for the uniform. For the type of this argument, see the GLSL API
	 */
	setUniform(name: string, value: any): void;
	/**
	 * Sets the value of many uniforms at once.
	 * @param uniforms - A set of key-value pairs, where the key represents the uniform name, and the value represents the uniform value
	 */
	setUniforms(uniforms: object): void;
	/**
	 * Retrieves the current value of a given uniform.
	 * For the return type of this function, see the GLSL API.
	 * @param name - The name of the uniform
	 */
	getUniform(name: string): any;
	/**
	 * Checks whether a given uniform exists.
	 * @param name - The name of the uniform to check
	 */
	argumentExists(name: string): boolean;
}

/**
 * Provides a collection of interpolation algorithms that operate on math objects.
 * All methods of this class are static and do not mutate their arguments.
 * ```js
 * Interpolation.lerp(new Color("red"), new Color("blue"), 0.5); // dark purple
 * Interpolation.lerp(new Vector2(0, 0), new Vector2(10, 0), 0.3); // (3, 0)
 * Interpolation.lerp(0, 10, 0.8) // 8
 * ```
 */
declare class Interpolation {
	/**
	 * Linearly interpolates between two values.
	 * @param a - The initial value
	 * @param b - The final value
	 * @param t - The progress proportion from the initial value to the final value, on the interval [0, 1]
	 */
	static lerp(a: MathObject, b: MathObject, t: number): MathObject;
	/**
	 * Smoothly interpolates between two values. (Uses the Interpolation.smooth easing function)
	 * @param a - The initial value
	 * @param b - The final value
	 * @param t - The progress proportion from the initial value to the final value, on the interval [0, 1]
	 */
	static smoothLerp(a: MathObject, b: MathObject, t: number): MathObject;
	/**
	 * Linearly interpolates between four values in a square formation.
	 * @param a - The value in the upper-left corner
	 * @param b - The value in the upper-right corner
	 * @param c - The value in the lower-left corner
	 * @param d - The value in the lower-right corner
	 * @param tx - The horizontal progress proportion
	 * @param ty - The vertical progress proportion
	 */
	static quadLerp(a: MathObject, b: MathObject, c: MathObject, d: MathObject, tx: number, ty: number): MathObject;
	/**
	 * Smoothly interpolates between four values in a square formation. (Uses the Interpolation.smooth easing function)
	 * @param a - The value in the upper-left corner
	 * @param b - The value in the upper-right corner
	 * @param c - The value in the lower-left corner
	 * @param d - The value in the lower-right corner
	 * @param tx - The horizontal progress proportion
	 * @param ty - The vertical progress proportion
	 */
	static smoothQuadLerp(a: MathObject, b: MathObject, c: MathObject, d: MathObject, tx: number, ty: number): MathObject;
	/**
	 * Linearly interpolates between eight values in a cube formation.
	 * @param a - The value in the front-upper-left corner
	 * @param b - The value in the front-upper-right corner
	 * @param c - The value in the front-lower-left corner
	 * @param d - The value in the front-lower-right corner
	 * @param a2 - The value in the back-upper-left corner
	 * @param b2 - The value in the back-upper-right corner
	 * @param c2 - The value in the back-lower-left corner
	 * @param d2 - The value in the back-lower-right corner
	 * @param tx - The horizontal progress proportion
	 * @param ty - The vertical progress proportion
	 * @param tz - The depth progress proportion
	 */
	static cubeLerp(a: MathObject, b: MathObject, c: MathObject, d: MathObject, a2: MathObject, b2: MathObject, c2: MathObject, d2: MathObject, tx: number, ty: number, tz: number): MathObject;
	/**
	 * Smoothly interpolates between eight values in a cube formation. (Uses the Interpolation.smooth easing function)
	 * @param a - The value in the front-upper-left corner
	 * @param b - The value in the front-upper-right corner
	 * @param c - The value in the front-lower-left corner
	 * @param d - The value in the front-lower-right corner
	 * @param a2 - The value in the back-upper-left corner
	 * @param b2 - The value in the back-upper-right corner
	 * @param c2 - The value in the back-lower-left corner
	 * @param d2 - The value in the back-lower-right corner
	 * @param tx - The horizontal progress proportion
	 * @param ty - The vertical progress proportion
	 * @param tz - The depth progress proportion
	 */
	static smoothCubeLerp(a: MathObject, b: MathObject, c: MathObject, d: MathObject, a2: MathObject, b2: MathObject, c2: MathObject, d2: MathObject, tx: number, ty: number, tz: number): MathObject;
	/**
	 * Computes the smooth minimum between two numbers.
	 * @param a - The first argument to the minimum
	 * @param b - The second argument to the minimum
	 * @param k - The smoothing parameter. Default is 1
	 */
	static smoothMin(a: number, b: number, k?: number): number;
	/**
	 * Computes the smooth maximum between two numbers.
	 * @param a - The first argument to the maximum
	 * @param b - The second argument to the maximum
	 * @param k - The smoothing parameter. Default is 1
	 */
	static smoothMax(a: number, b: number, k?: number): number;
	/**
	 * A linear easing function. Can be used to adjust animation timing.
	 * @param t - The input parameter value, on [0, 1]
	 */
	static linear(t: number): number;
	/**
	 * A smoothed easing function. Can be used to adjust animation timing.
	 * @param t - The input parameter value, on [0, 1]
	 */
	static smooth(t: number): number;
	/**
	 * A increasing-speed easing function. Can be used to adjust animation timing.
	 * @param t - The input parameter value, on [0, 1]
	 */
	static increasing(t: number): number;
	/**
	 * A decreasing-speed easing function. Can be used to adjust animation timing.
	 * @param t - The input parameter value, on [0, 1]
	 */
	static decreasing(t: number): number;
}

/**
 * Represents a MathObject-valued variable that smoothly moves between values.
 * If a transition between states is interrupted by setting a new target, the new transition will begin immediately and will begin from the current position.
 * ```js
 * const point = new Animatable(middle, 100, Interpolation.smooth);
 * 
 * intervals.continuous(() => {
 * 	if (mouse.justPressed("Left"))
 * 		point.target = mouse.screen;
 * 	renderer.draw(new Color("black")).circle(point.value, 10);
 * });
 * ```
 */
declare class Animatable {
	/**
	 * The current target value of the animatable
	 */
	target: Operable;
	/**
	 * The length of each transition, in frames
	 */
	duration: number;
	/**
	 * The easing function for the transitions
	 */
	easing: (arg0: number) => number;
	/**
	 * Whether or not target values should be copied. If this value is false, changing the value passed into target will change the trajectory of the value, even if the value is not passed in again
	 */
	copyTarget: boolean;
	/**
	 * Creates a new Animatable.
	 * @param initial - The initial value
	 * @param duration - The length of each transition, in frames
	 * @param easing - The easing function to use. Default is `Interpolation.linear`
	 * @param copyTarget - Whether or not target values should be copied. Default is true
	 */
	constructor(initial: MathObject, duration: number, easing?: (arg0: number) => number, copyTarget?: boolean);
	/**
	 * Sets the value immediately. This will not involve a transition.
	 * @param value - The new value
	 */
	set value(value: MathObject);
	/**
	 * Returns the current value of the animatable and advances one frame in the transition.
	 */
	get value(): MathObject;
	/**
	 * Returns the current value of the animatable and doesn't advance the transition
	 */
	get current(): MathObject;
}

/**
 * Represents an N by N square matrix which can be used to transform vectors of dimension N or (N - 1) via homogenous coordinates.
 * This is an abstract superclass and should not be constructed.
 */
declare class Matrix extends Float64Array implements Copyable, Serializable {
	/**
	 * Creates a new Matrix. Since this class is abstract, this constructor can only be used via its subclasses.
	 * @param elements - The elements of the matrix, in row-major object
	 */
	constructor(...elements: number[]);
	/**
	 * Creates a new Matrix. Since this class is abstract, this constructor can only be used via its subclasses.
	 * @param columns - The columns of the matrix
	 */
	constructor(...columns: Vector[]);
	/**
	 * Creates a new Matrix. Since this class is abstract, this constructor can only be used via its subclasses.
	 * @param base - A matrix of less or equal dimension. If specified, the constructed matrix will be an identity matrix with the elements of this argument superimposed on it from the upper-left. Otherwise, the constructed matrix will be an unaltered identity matrix
	 */
	constructor(base?: this);
	/**
	 * Returns the maximum length ratio (`this.times(v).mag / v.mag`) that is possible for a Vector `v` of the same dimension as the caller.
	 */
	get maxScaleFactor(): number;
	/**
	 * Returns the maximum length ratio (`this.times(v).mag / v.mag`) that is possible for a Vector `v` of one less dimension than the caller.
	 */
	get maxHomogenousScaleFactor(): number;
	/**
	 * Returns a transposed copy of the caller.
	 */
	get transposed(): this;
	/**
	 * Returns a inverted copy of the caller, or null if the caller is singular.
	 */
	get inverse(): this | null;
	/**
	 * Returns the determinant of the caller.
	 */
	get determinant(): number;
	/**
	 * Transposes the matrix in-place (swapping rows with columns) and returns it.
	 */
	transpose(): this;
	/**
	 * If the caller is invertible, this inverts the caller in-place and returns it, otherwise returns null.
	 */
	invert(): this | null;
	/**
	 * Retrieves an element from the caller at a given position.
	 * @param row - The 0-based row index
	 * @param column - The 0-based column index
	 */
	at(row: number, column: number): number;
	/**
	 * Replaces an element of the caller at a given position with a new value.
	 * @param row - The 0-based row index
	 * @param column - The 0-based column index
	 * @param value - The new element value
	 */
	update(row: number, column: number, value: number): void;
	/**
	 * Retrieves a column of the caller.
	 * @param column - The 0-based column index
	 */
	column(column: number): Vector;
	/**
	 * Retrieves a row of the caller.
	 * @param row - The 0-based row index
	 */
	row(row: number): Vector;
	/**
	 * Computes the sum or difference between the caller and a given object, and returns the result.
	 * @param other - The right-hand operand of the sum
	 * @param result - A matrix to optionally store the result in. If not specified, a new matrix will be created
	 */
	plus(other: this | number, result?: this): this;
	/**
	 * Computes the sum or difference between the caller and a given object, and returns the result.
	 * @param other - The right-hand operand of the sum
	 * @param result - A matrix to optionally store the result in. If not specified, a new matrix will be created
	 */
	minus(other: this | number, result?: this): this;
	/**
	 * Adds or subtracts a given object from the caller in-place and returns it.
	 * @param other - The right-hand operand of the sum
	 */
	add(other: this | number): this;
	/**
	 * Adds or subtracts a given object from the caller in-place and returns it.
	 * @param other - The right-hand operand of the sum
	 */
	sub(other: this | number): this;
	/**
	 * Multiplies the caller in-place with another object.
	 * Returns the caller.
	 * @param other - The right-hand operand of the product
	 */
	mul(other: this | number): this;
	/**
	 * Projects a vector of dimension N - 1 by extending it with an additional 1, and dividing by the resulting final component.
	 * @param vector - The vector to project
	 * @param result - The destination to store the resulting vector in. If not specified, a new vector will be created
	 */
	project(vector: Vector, result?: Vector): Vector;
	/**
	 * Computes the product of the caller and another object and returns the result.
	 * @param other - The right-hand side of the product. If this is a vector of dimension N - 1, it will be converted to and from homogenous coordinates to facilitate the multiplication
	 * @param result - A destination to optionally store the result in. If not specified, the result will be a new vector or matrix
	 */
	times(other: this | Vector | number, result?: this | Vector): this | Vector | number;
	/**
	 * Creates an N - 1 dimensional homogenous scaling matrix about a given point and optionally stores it in a provided destination.
	 * @param scale - The scale factor along every axis. If this is a number, the matrix will scale uniformly on all axes
	 * @param center - The center to scale about
	 * @param result - The matrix to copy the scaling matrix into
	 */
	static scaleAbout(scale: Vector | number, center: Vector, result?: Matrix): Matrix;
	/**
	 * Creates an N - 1 dimensional homogenous scaling matrix and optionally stores it in a provided destination.
	 * @param scale - The scale factor along every axis
	 * @param result - The matrix to copy the scaling matrix into
	 */
	static scale(scale: number, result?: Matrix): Matrix;
	/**
	 * Creates an N - 1 dimensional homogenous scaling matrix and optionally stores it in a provided destination.
	 * @param axes - The scale factor along each of the axes
	 * @param result - The matrix to copy the scaling matrix into
	 */
	static scale(...axes: number[], result?: Matrix): Matrix;
	/**
	 * Creates an N - 1 dimensional homogenous scaling matrix and optionally stores it in a provided destination.
	 * @param vector - A vector where each component specifies the scale factor on its corresponding axis
	 * @param result - The matrix to copy the scaling matrix into
	 */
	static scale(vector: Vector, result?: Matrix): Matrix;
	/**
	 * Creates a N - 1 dimensional homogenous translation matrix and optionally stores it in a provided destination.
	 * @param axes - The translation along each of the N - 1 axes
	 * @param result - The matrix to copy the translation matrix into
	 */
	static translation(...axes: number[], result?: Matrix): Matrix;
	/**
	 * Creates a N - 1 dimensional homogenous translation matrix and optionally stores it in a provided destination.
	 * @param vector - The N - 1 dimensional vector to translate by
	 * @param result - The matrix to copy the translation matrix into
	 */
	static translation(vector: Vector, result?: Matrix): Matrix;
	/**
	 * Creates an identity matrix and optionally stores it in a provided destination.
	 * @param destination - The matrix to copy the identity matrix into
	 */
	static identity(destination?: Matrix): Matrix;
	/**
	 * Multiplies a series of matrices together and optionally stores the result in a provided destination.
	 * @param matrices - The matrices to multiply together. Order matters for this argument
	 * @param result - The matrix to copy the result into
	 */
	static mul(matrices: Matrix[], result?: Matrix): Matrix;
	/**
	 * Creates a copy of the object and optionally stores it in a provided destination.
	 * @param destination - The destination to copy the object into. This must be the same type as the caller
	 */
	get(destination?: this): this;
	/**
	 * Writes the object to a buffer and returns it.
	 * @param buffer - A destination buffer to write the result to. If not specified, a new buffer will be created
	 */
	toByteBuffer(buffer?: ByteBuffer): ByteBuffer;
	/**
	 * Creates an instance of the class based on data read from the current pointed-to location in a buffer. This increments the buffer's pointer to after the data of the instance.
	 * @param buffer - A source buffer to read the data from
	 */
	static fromByteBuffer(buffer: ByteBuffer): Serializable;
}

/**
 * Represents a 2 by 2 matrix for use with 2D vectors.
 */
declare class Matrix2 extends Matrix {
	
}

/**
 * Represents a 3 by 3 matrix for use with 2D vectors in homogenous coordinates or 3D vectors in standard coordinates.
 * ```js
 * const transformation = Matrix3.mul([
 * 	Matrix3.translation(10, 5),
 * 	Matrix3.rotation(Math.PI)
 * ]);
 * 
 * const initialPoint = new Vector2(10, 20);
 * 
 * const finalPoint = transformation.times(initialPoint);
 * console.log(finalPoint); // (0, -15)
 * 
 * const initialAgain = transformation.inverse.times(finalPoint);
 * console.log(initialAgain); // (10, 20)
 * ```
 */
declare class Matrix3 extends Matrix {
	/**
	 * Converts the matrix to a CSS matrix string.
	 */
	toCSS(): string;
	/**
	 * Creates a 2D rotation matrix and optionally stores it in a provided destination.
	 * @param theta - The clockwise (in Screen-Space) angle (in radians) to rotate by
	 * @param result - The matrix to copy the rotation matrix into
	 */
	static rotation(theta: number, result?: Matrix3): Matrix3;
}

/**
 * Represents a 4 by 4 matrix for use with 3D vectors in homogenous coordinates or 4D vectors in standard coordinates.
 */
declare class Matrix4 extends Matrix {
	/**
	 * Creates a counter-clockwise rotation matrix about a specified axis by a specified angle and optionally stores it in a provided destination.
	 * @param angle - The rotation. The direction of this vector is the axis of rotation, and the magnitude is the angle
	 * @param result - The destination to store the resulting matrix in. If not specified, a new matrix will be created
	 */
	static rotation(angle: Vector3, result?: Matrix4): void;
	/**
	 * Creates a perspective projection matrix for use in 3D rendering.
	 * @param aspectRatio - The aspect ratio of the surface on which the rendering will occur (`height / width`)
	 * @param fov - The angular size of the vertical field of view in radians
	 * @param zNear - The near clipping plane
	 * @param zFar - The far clipping plane
	 * @param result - The destination to store the resulting matrix in. If not specified, a new matrix will be created
	 */
	static perspective(aspectRatio: number, fov: number, zNear: number, zFar: number, result?: Matrix4): Matrix4;
	/**
	 * Creates an orthographic projection matrix for use in 3D rendering.
	 * The x and y range parameters can be specified as numbers to indicate the size of a 0-centered range (e.g. `6` corresponds to `new Range(-3, 3)`).
	 * @param xRange - The range along the x axis of view space to include in the projection
	 * @param yRange - The range along the y axis of view space to include in the projection
	 * @param zRange - The range along the z axis of view space to include in the projection. If this is specified as a number, it represents a range from 0 to the argument (e.g. `6` corresponds to `new Range(0, 6)`)
	 * @param result - The destination to store the resulting matrix in. If not specified, a new matrix will be created
	 */
	static orthographic(xRange: Range | number, yRange: Range | number, zRange: Range | number, result?: Matrix4): Matrix4;
	/**
	 * Creates an orthographic projection matrix for use in 3D rendering.
	 * The x and y range parameters can be specified as numbers to indicate the size of a 0-centered range (e.g. `6` corresponds to `new Range(-3, 3)`).
	 * @param bounds - The range to include in the projection
	 * @param result - The destination to store the resulting matrix in. If not specified, a new matrix will be created
	 */
	static orthographic(bounds: Prism, result?: Matrix4): Matrix4;
}

/**
 * Represents a physical constraint between one or more SceneObjects.
 * This is an abstract superclass and should not be constructed.
 */
declare class Constraint {
	/**
	 * Returns the World-Space location of the constrained points.
	 */
	get ends(): VectorN[];
	/**
	 * Removes the constraint from the simulation.
	 */
	remove(): void;
}

/**
 * Represents a physical constraint between a SceneObject and a fixed point.
 */
declare class Constraint1 extends Constraint {
	/**
	 * The local-space offset of the constrained point on the object
	 */
	offset: VectorN;
	/**
	 * The fixed point in the constraint
	 */
	point: VectorN;
	/**
	 * The desired distance between the two constrained points. This is only defined for length constraints
	 */
	length: number;
	/**
	 * Returns the object in the constraint.
	 */
	get body(): SceneObject;
}

/**
 * Represents a physical constraint between two SceneObjects.
 */
declare class Constraint2 extends Constraint {
	/**
	 * The local-space offset of the constrained point on the first object
	 */
	offsetA: VectorN;
	/**
	 * The local-space offset of the constrained point on the second object
	 */
	offsetB: VectorN;
	/**
	 * Whether or not the first object should be considered static by the constraint
	 */
	staticA: boolean;
	/**
	 * Whether or not the second object should be considered static by the constraint
	 */
	staticB: boolean;
	/**
	 * The desired distance between the two constrained points. This is only defined for length constraints
	 */
	length: number;
	/**
	 * Returns the first object in the constraint.
	 */
	get bodyA(): SceneObject;
	/**
	 * Returns the second object in the constraint.
	 */
	get bodyB(): SceneObject;
}

/**
 * Represents a collision with another SceneObject.
 */
declare class CollisionData {
	/**
	 * The object that is being collided with
	 */
	element: SceneObject;
	/**
	 * A unit vector along the collision normal pointing toward the other object
	 */
	direction: VectorN;
	/**
	 * A list of World-Space contact points between the two objects
	 */
	contacts: VectorN[];
	/**
	 * Indicates whether the object being collided with requested that the collision be a trigger collision. A trigger collision is not resolved
	 */
	isTrigger: boolean;
}

/**
 * Represents a collection of collisions that a SceneObject is undergoing.
 */
declare class CollisionMonitor {
	/**
	 * Returns all collisions. If there are no collisions, this returns null.
	 */
	get general(): CollisionData[] | null;
	/**
	 * Returns all collisions on the left side of the object. If there are no collisions, this returns null.
	 */
	get left(): CollisionData[] | null;
	/**
	 * Returns all collisions on the right side of the object. If there are no collisions, this returns null.
	 */
	get right(): CollisionData[] | null;
	/**
	 * Returns all collisions with the top edge of the object. If there are no collisions, this returns null.
	 */
	get top(): CollisionData[] | null;
	/**
	 * Returns all collisions with the bottom edge of the object. If there are no collisions, this returns null.
	 */
	get bottom(): CollisionData[] | null;
	/**
	 * Returns all collisions on the front (+Z) side of the object.
	 * If there are no collisions, this returns null.
	 * This accessor only works in 3D Mode.
	 */
	get front(): CollisionData[] | null;
	/**
	 * Returns all collisions on the back (-Z) side of the object.
	 * If there are no collisions, this returns null.
	 * This accessor only works in 3D Mode.
	 */
	get back(): CollisionData[] | null;
	/**
	 * Checks whether there is a collision with a specific object.
	 * @param object - The object to check
	 */
	has(object: SceneObject): boolean;
	/**
	 * Returns all collisions where the collision is in a specific direction.
	 * If there are no such collisions, this returns null.
	 * @param direction - A unit vector representing the direction to check. This will be interpreted as pointing toward the other object, rather than away
	 */
	direction(direction: VectorN): CollisionData[] | null;
	/**
	 * Returns all collisions meeting a specific requirement.
	 * If there are no such collisions, this returns null.
	 * @param mask - The function that will be passed each collision to determine its eligibility
	 */
	test(mask: (arg0: CollisionData) => boolean): CollisionData[] | null;
}

/**
 * Represents a seeded random number generator.
 * All instance methods of this class are available statically, so `Random.int(3, 5)` is valid and uses statically stored state of the class itself.
 * The random number generation functions of this class are organized into two categories: stable and unstable.
 * Stable functions will produce the same value when called with the same arguments.
 * Unstable functions don't take any seeding parameters and change their return value on each call.
 * ```js
 * let total = 0;
 * let count = 0;
 * 
 * intervals.continuous(() => {
 * 	total += Random.int(1, 10); // generate a random value each frame
 * 	count++;
 * 	const mean = total / count; // compute the mean of the random values
 * 	renderer.draw(new Color("black")).text(Font.Arial20, mean, 10, 10);
 * });
 * ```
 */
declare class Random {
	/**
	 * The current seed for the unstable random functions. e.g. `.random()`, `.angle()`, `.range()`, etc.
	 */
	seed: number;
	/**
	 * The seed for the stable random functions. e.g. `.perlin3D()`, `.voronoi()`, etc.
	 */
	sampleSeed: number;
	/**
	 * The distribution of the numbers generated. This is one of the provided static distribution properties of the Random class (`.uniform`, `.normal`, etc.)
	 */
	distribution: Function;
	/**
	 * A uniform distribution
	 */
	static uniform: Function;
	/**
	 * A normal distribution
	 */
	static normal: Function;
	/**
	 * Creates a new random number generator. If either of the seeds are unspecified, they will be initialized to random numbers.
	 * @param seed - The initial seed for the unstable random functions.
	 * @param sampleSeed - The seed used for the stable random functions.
	 * @param distribution - The initial distribution for the numbers generated. Default is `Random.uniform`
	 */
	constructor(seed: number, sampleSeed: number, distribution?: Function);
	/**
	 * Creates a new random number generator. If either of the seeds are unspecified, they will be initialized to random numbers.
	 * @param seed - The initial seed for unstable functions
	 * @param distribution - The initial distribution. Default is `Random.uniform`
	 */
	constructor(seed: number, distribution?: Function);
	/**
	 * Creates a new random number generator. If either of the seeds are unspecified, they will be initialized to random numbers.
	 * @param distribution - The initial distribution
	 */
	constructor(distribution: Function);
	/**
	 * Returns a random number on [0, 1). Unstable.
	 */
	random(): number;
	/**
	 * Returns a random value in an unbounded normal distribution. Unstable
	 * @param mu - The mean return value. Default is 0
	 * @param sd - The standard deviation of possible return values. Default is 1
	 */
	normalZ(mu?: number, sd?: number): number;
	/**
	 * Returns a random integer on [min, max]. Unstable.
	 * @param min - The lower bound
	 * @param max - The upper bound
	 */
	int(min: number, max: number): number;
	/**
	 * Returns a random boolean value. Unstable.
	 * @param chance - The probability that the return value is true. Default is 0.5
	 */
	bool(chance?: number): boolean;
	/**
	 * Returns a random sign, with a 50/50 chance to be -1 or 1. Unstable.
	 */
	sign(): number;
	/**
	 * Returns a random floating-point value on [min, max). Unstable.
	 * @param min - The lower bound. Default is -1
	 * @param max - The upper bound. Default is the negative of min
	 */
	range(min?: number, max?: number): number;
	/**
	 * Returns a random valid index for a given array. Unstable.
	 * @param arr - The array to choose an index for
	 */
	index(arr: any[]): number;
	/**
	 * Returns a random angle in radians on [0, 2π). Unstable.
	 */
	angle(): number;
	/**
	 * Returns a random single character utf-16 string. Unstable.
	 */
	char(): string;
	/**
	 * Returns a random opaque color. Unstable.
	 * @param result - The destination for the color. Default is a new color.
	 */
	color(result?: Color): Color;
	/**
	 * Returns a random point within a given convex shape.
	 * This method only works with `.distribution` being `Random.uniform`.
	 * Unstable.
	 * @param region - The region within which to generate the point
	 */
	inShape(region: Shape): Vector2;
	/**
	 * Randomly orders an array in-place. Unstable.
	 * @param arr - The array to reorder
	 */
	shuffle(arr: any[]): any[];
	/**
	 * Chooses an (optionally weighted) random element from an array. Unstable.
	 * @param values - The values to choose from
	 */
	choice(values: Iterable): any;
	/**
	 * Chooses an (optionally weighted) random element from an array. Unstable.
	 * @param values - The values to choose from
	 * @param percentages - The weight of each value. These can be multiplied by any constant factor
	 */
	choice(values: Iterable, percentages: number[]): any;
	/**
	 * Randomly selects a sample (with replacement) from a given collection of values. Unstable.
	 * @param values - The values to sample from
	 * @param quantity - The size of the sample
	 */
	sample(values: Iterable, quantity: number): any[];
	/**
	 * Randomly selects a sample (without replacement) from a given collection of values. Unstable.
	 * @param values - The values to sample from
	 * @param quantity - The size of the sample
	 */
	sampleWithoutReplacement(values: Iterable, quantity: number): any[];
	/**
	 * Returns the sum of a specified number of octaves of a specified type of noise.
	 * @param octaves - The number of octaves
	 * @param algorithm - The stable algorithm of which octaves are being generated
	 * @param noiseArgs - The arguments to the noise function
	 */
	octave(octaves: number, algorithm: Function, ...noiseArgs: number[]): number;
	/**
	 * Samples 1D Perlin noise.
	 * @param x - The sample location
	 * @param f - The frequency of the Perlin noise. Default is 1
	 * @param seed - The seed for the noise. Default is sampleSeed
	 */
	perlin(x: number, f?: number, seed?: number): number;
	/**
	 * Samples 2D Perlin noise.
	 * @param x - The sample location's x coordinate
	 * @param y - The sample location's y coordinate
	 * @param f - The frequency of the Perlin noise. Default is 1
	 * @param seed - The seed for the noise. Default is sampleSeed
	 */
	perlin2D(x: number, y: number, f?: number, seed?: number): number;
	/**
	 * Samples 3D Perlin noise.
	 * @param x - The sample location's x coordinate
	 * @param y - The sample location's y coordinate
	 * @param z - The sample location's z coordinate
	 * @param f - The frequency of the Perlin noise. Default is 1
	 * @param seed - The seed for the noise. Default is sampleSeed
	 */
	perlin3D(x: number, y: number, z: number, f?: number, seed?: number): number;
	/**
	 * Samples 1D Voronoi noise.
	 * @param x - The sample location
	 * @param f - The frequency of the Voronoi noise. Default is 1
	 * @param seed - The seed for the noise. Default is sampleSeed
	 */
	voronoi(x: number, f?: number, seed?: number): number;
	/**
	 * Samples 2D Voronoi noise.
	 * @param x - The sample location's x coordinate
	 * @param y - The sample location's y coordinate
	 * @param f - The frequency of the Voronoi noise. Default is 1
	 * @param seed - The seed for the noise. Default is sampleSeed
	 */
	voronoi2D(x: number, y: number, f?: number, seed?: number): number;
	/**
	 * Samples 3D Voronoi noise.
	 * @param x - The sample location's x coordinate
	 * @param y - The sample location's y coordinate
	 * @param z - The sample location's z coordinate
	 * @param f - The frequency of the Voronoi noise. Default is 1
	 * @param seed - The seed for the noise. Default is sampleSeed
	 */
	voronoi3D(x: number, y: number, z: number, f?: number, seed?: number): number;
	/**
	 * Chooses a new random seed and sampleSeed for the random number generator.
	 */
	reSeed(): void;
	/**
	 * The current seed for the unstable random functions. e.g. `.random()`, `.angle()`, `.range()`, etc.
	 */
	static seed: number;
	/**
	 * The seed for the stable random functions. e.g. `.perlin3D()`, `.voronoi()`, etc.
	 */
	static sampleSeed: number;
	/**
	 * Returns a random number on [0, 1). Unstable.
	 */
	static random(): number;
	/**
	 * Returns a random value in an unbounded normal distribution. Unstable
	 * @param mu - The mean return value. Default is 0
	 * @param sd - The standard deviation of possible return values. Default is 1
	 */
	static normalZ(mu?: number, sd?: number): number;
	/**
	 * Returns a random integer on [min, max]. Unstable.
	 * @param min - The lower bound
	 * @param max - The upper bound
	 */
	static int(min: number, max: number): number;
	/**
	 * Returns a random boolean value. Unstable.
	 * @param chance - The probability that the return value is true. Default is 0.5
	 */
	static bool(chance?: number): boolean;
	/**
	 * Returns a random sign, with a 50/50 chance to be -1 or 1. Unstable.
	 */
	static sign(): number;
	/**
	 * Returns a random floating-point value on [min, max). Unstable.
	 * @param min - The lower bound. Default is -1
	 * @param max - The upper bound. Default is the negative of min
	 */
	static range(min?: number, max?: number): number;
	/**
	 * Returns a random valid index for a given array. Unstable.
	 * @param arr - The array to choose an index for
	 */
	static index(arr: any[]): number;
	/**
	 * Returns a random angle in radians on [0, 2π). Unstable.
	 */
	static angle(): number;
	/**
	 * Returns a random single character utf-16 string. Unstable.
	 */
	static char(): string;
	/**
	 * Returns a random opaque color. Unstable.
	 * @param result - The destination for the color. Default is a new color.
	 */
	static color(result?: Color): Color;
	/**
	 * Returns a random point within a given convex shape.
	 * This method only works with `.distribution` being `Random.uniform`.
	 * Unstable.
	 * @param region - The region within which to generate the point
	 */
	static inShape(region: Shape): Vector2;
	/**
	 * Randomly orders an array in-place. Unstable.
	 * @param arr - The array to reorder
	 */
	static shuffle(arr: any[]): any[];
	/**
	 * Chooses an (optionally weighted) random element from an array. Unstable.
	 * @param values - The values to choose from
	 */
	static choice(values: Iterable): any;
	/**
	 * Chooses an (optionally weighted) random element from an array. Unstable.
	 * @param values - The values to choose from
	 * @param percentages - The weight of each value. These can be multiplied by any constant factor
	 */
	static choice(values: Iterable, percentages: number[]): any;
	/**
	 * Randomly selects a sample (with replacement) from a given collection of values. Unstable.
	 * @param values - The values to sample from
	 * @param quantity - The size of the sample
	 */
	static sample(values: Iterable, quantity: number): any[];
	/**
	 * Randomly selects a sample (without replacement) from a given collection of values. Unstable.
	 * @param values - The values to sample from
	 * @param quantity - The size of the sample
	 */
	static sampleWithoutReplacement(values: Iterable, quantity: number): any[];
	/**
	 * Returns the sum of a specified number of octaves of a specified type of noise.
	 * @param octaves - The number of octaves
	 * @param algorithm - The stable algorithm of which octaves are being generated
	 * @param noiseArgs - The arguments to the noise function
	 */
	static octave(octaves: number, algorithm: Function, ...noiseArgs: number[]): number;
	/**
	 * Samples 1D Perlin noise.
	 * @param x - The sample location
	 * @param f - The frequency of the Perlin noise. Default is 1
	 * @param seed - The seed for the noise. Default is sampleSeed
	 */
	static perlin(x: number, f?: number, seed?: number): number;
	/**
	 * Samples 2D Perlin noise.
	 * @param x - The sample location's x coordinate
	 * @param y - The sample location's y coordinate
	 * @param f - The frequency of the Perlin noise. Default is 1
	 * @param seed - The seed for the noise. Default is sampleSeed
	 */
	static perlin2D(x: number, y: number, f?: number, seed?: number): number;
	/**
	 * Samples 3D Perlin noise.
	 * @param x - The sample location's x coordinate
	 * @param y - The sample location's y coordinate
	 * @param z - The sample location's z coordinate
	 * @param f - The frequency of the Perlin noise. Default is 1
	 * @param seed - The seed for the noise. Default is sampleSeed
	 */
	static perlin3D(x: number, y: number, z: number, f?: number, seed?: number): number;
	/**
	 * Samples 1D Voronoi noise.
	 * @param x - The sample location
	 * @param f - The frequency of the Voronoi noise. Default is 1
	 * @param seed - The seed for the noise. Default is sampleSeed
	 */
	static voronoi(x: number, f?: number, seed?: number): number;
	/**
	 * Samples 2D Voronoi noise.
	 * @param x - The sample location's x coordinate
	 * @param y - The sample location's y coordinate
	 * @param f - The frequency of the Voronoi noise. Default is 1
	 * @param seed - The seed for the noise. Default is sampleSeed
	 */
	static voronoi2D(x: number, y: number, f?: number, seed?: number): number;
	/**
	 * Samples 3D Voronoi noise.
	 * @param x - The sample location's x coordinate
	 * @param y - The sample location's y coordinate
	 * @param z - The sample location's z coordinate
	 * @param f - The frequency of the Voronoi noise. Default is 1
	 * @param seed - The seed for the noise. Default is sampleSeed
	 */
	static voronoi3D(x: number, y: number, z: number, f?: number, seed?: number): number;
	/**
	 * Chooses a new random seed and sampleSeed for the random number generator.
	 */
	static reSeed(): void;
}

/**
 * Represents a multidimensional vector.
 * This is an abstract superclass and should not be constructed.
 */
declare class Vector extends Operable {
	/**
	 * The magnitude of the vector
	 */
	mag: number;
	/**
	 * The squared magnitude of the vector
	 */
	sqrMag: number;
	/**
	 * The unit vector in the same direction of the vector
	 */
	normalized: this;
	/**
	 * Normalizes the vector in-place and returns the caller.
	 */
	normalize(): this;
	/**
	 * Computes the dot product between the caller and another vector.
	 * @param other - The vector to take the dot product with
	 */
	dot(other: this): number;
	/**
	 * Computes the reflection of the caller off a provided normal vector.
	 * Doesn't mutate the caller.
	 * @param normal - The normal vector to reflect off of
	 */
	reflect(normal: this): this;
	/**
	 * Computes the projection of the caller onto another vector.
	 * Doesn't mutate the caller.
	 * @param other - The vector to project the caller onto
	 */
	projectOnto(other: this): this;
	/**
	 * Computes a version of the caller with one coordinate axis replaced with 0.
	 * This is equivalent to `this.minus(this.projectOnto(axis))` for `axis.mag === 1`.
	 * Doesn't mutate the caller.  
	 * @param axis - The unit vector axis to remove from the caller
	 */
	without(axis: this): this;
	/**
	 * Computes the distance between two vectors. 
	 * @param a - The first vector
	 * @param b - The second vector
	 */
	static dist(a: Vector, b: Vector): number;
	/**
	 * Computes the squared distance between two vectors. 
	 * @param a - The first vector
	 * @param b - The second vector
	 */
	static sqrDist(a: Vector, b: Vector): number;
	/**
	 * Returns the size of the vector type.
	 */
	static size: number;
}

/**
 * Represents a 2D vector.
 * ```js
 * const i = new Vector2(1, 0);
 * const j = new Vector2(0, 1);
 * console.log(i.dot(j)); // 0
 * console.log(i.cross(j)); // 1
 * console.log(i.plus(j).normalize()); // (1/√2, 1/√2)
 * ```
 */
declare class Vector2 extends Vector {
	/**
	 * The clockwise (in Screen-Space) angle of the vector from the horizontal
	 */
	angle: number;
	/**
	 * The vector with the same magnitude but perpendicular direction. Right-handed (in Screen-Space)
	 */
	normal: this;
	/**
	 * The modifiable elements of the vector, `["x", "y"]`
	 */
	static modValues: string[];
	/**
	 * Creates a new Vector2.
	 * @param x - The x component
	 * @param y - The y component
	 */
	constructor(x: number, y: number);
	/**
	 * Rotates the vector clockwise (in Screen-Space). This operation is in-place and returns the caller.
	 * @param angle - The amount (in radians) to rotate by
	 */
	rotate(angle: number): this;
	/**
	 * Returns a copy of the vector rotated clockwise (in Screen-Space) by a specified angle.
	 * @param angle - The amount (in radians) to rotate by
	 */
	rotated(angle: number): this;
	/**
	 * Returns the 2D "cross product" (x1 * y2 - y1 * x2) between the caller and another vector.
	 * @param v - The second vector in the product
	 */
	cross(v: this): number;
	/**
	 * Returns a new unit vector pointing in a specified direction (in Screen-Space).
	 */
	static left: Vector2;
	/**
	 * Returns a new unit vector pointing in a specified direction (in Screen-Space).
	 */
	static right: Vector2;
	/**
	 * Returns a new unit vector pointing in a specified direction (in Screen-Space).
	 */
	static up: Vector2;
	/**
	 * Returns a new unit vector pointing in a specified direction (in Screen-Space).
	 */
	static down: Vector2;
	/**
	 * Returns a new vector with both components initialized to 0.
	 */
	static origin: Vector2;
	/**
	 * Creates a vector with a specified x component and a y component of 0.
	 * @param x - The x coordinate
	 */
	static x(x: number): Vector2;
	/**
	 * Creates a vector with a specified y component and an x component of 0.
	 * @param y - The y coordinate
	 */
	static y(y: number): Vector2;
	/**
	 * Creates a unit vector with a specified clockwise (in Screen-Space) angle from the horizontal.
	 * @param angle - The angle of the vector
	 */
	static fromAngle(angle: number): Vector2;
	/**
	 * Creates a cartesian vector from a given set of polar coordinates .
	 * @param  - The clockwise (in Screen-Space) angle from the horizontal
	 * @param r - The distance from the origin. Default is 1
	 */
	static polar(θ: number, r?: number): Vector2;
}

/**
 * Represents a 3D vector.
 */
declare class Vector3 extends Vector {
	/**
	 * The counter-clockwise angle of the vector from the horizontal on the U-V plane. e.g. `vec.angleXY` or `vec.angleYZ`
	 */
	angleXY: number;
	/**
	 * The counter-clockwise angle of the vector from the horizontal on the U-V plane. e.g. `vec.angleXY` or `vec.angleYZ`
	 */
	angleXZ: number;
	/**
	 * The counter-clockwise angle of the vector from the horizontal on the U-V plane. e.g. `vec.angleXY` or `vec.angleYZ`
	 */
	angleYZ: number;
	/**
	 * The modifiable elements of the vector, `["x", "y", "z"]`
	 */
	static modValues: string[];
	/**
	 * Creates a new Vector3.
	 * @param x - The x component
	 * @param y - The y component
	 * @param z - The z component
	 */
	constructor(x: number, y: number, z: number);
	/**
	 * Returns a vector which is perpendicular to the caller.
	 * This is not guaranteed to have any other properties.
	 */
	get normal(): this;
	/**
	 * Returns the cross product between the caller and another vector.
	 * @param v - The second vector in the product
	 * @param result - The destination to store the resulting Vector in. If not specified, a new Vector will be created
	 */
	cross(v: this, result?: this): number;
	/**
	 * Returns a matrix such that for Vector3s `u` and `v`, `u.crossMatrix().times(v)` is the same as `u.cross(v)`. 
	 * @param result - The destination to store the resulting matrix in. If this is not specified, a new matrix will be created
	 */
	crossMatrix(result?: Matrix3): Matrix3;
	/**
	 * Rotates the vector counter-clockwise about a given axis by a specified angle in-place.
	 * Returns the caller.
	 * @param angle - The direction of this vector is the axis of rotation, and the magnitude is the angle
	 */
	rotate(angle: this): this;
	/**
	 * Rotates a copy of the vector counter-clockwise about a given axis by a specified angle.
	 * Returns the rotated copy.
	 * @param angle - The direction of this vector is the axis of rotation, and the magnitude is the angle
	 */
	rotated(angle: this): this;
	/**
	 * Rotates the vector counter-clockwise on the U-V plane. This operation is in-place and returns the caller.
	 * e.g. `vec.rotateYZ(0.1)`
	 * @param angle - The amount (in radians) to rotate by
	 */
	rotateXY(angle: number): this;
	/**
	 * Rotates the vector counter-clockwise on the U-V plane. This operation is in-place and returns the caller.
	 * e.g. `vec.rotateYZ(0.1)`
	 * @param angle - The amount (in radians) to rotate by
	 */
	rotateXZ(angle: number): this;
	/**
	 * Rotates the vector counter-clockwise on the U-V plane. This operation is in-place and returns the caller.
	 * e.g. `vec.rotateYZ(0.1)`
	 * @param angle - The amount (in radians) to rotate by
	 */
	rotateYZ(angle: number): this;
	/**
	 * Returns a copy of the vector rotated counter-clockwise on the U-V plane.
	 * @param angle - The amount (in radians) to rotate by
	 */
	rotatedXY(angle: number): this;
	/**
	 * Returns a copy of the vector rotated counter-clockwise on the U-V plane.
	 * @param angle - The amount (in radians) to rotate by
	 */
	rotatedXZ(angle: number): this;
	/**
	 * Returns a copy of the vector rotated counter-clockwise on the U-V plane.
	 * @param angle - The amount (in radians) to rotate by
	 */
	rotatedYZ(angle: number): this;
	/**
	 * Rotates the vector counter-clockwise in-place about a specified axis.
	 * Returns the caller.
	 * @param axis - The axis to rotate about
	 * @param angle - The angle to rotate by
	 */
	rotateAboutAxis(axis: this, angle: number): this;
	/**
	 * Returns a copy of the vector rotated counter-clockwise about a specified axis.
	 * @param axis - The axis to rotate about
	 * @param angle - The angle to rotate by
	 */
	rotatedAboutAxis(axis: this, angle: number): this;
	/**
	 * Returns a new unit vector pointing in the specified direction.
	 */
	static left: Vector3;
	/**
	 * Returns a new unit vector pointing in the specified direction.
	 */
	static right: Vector3;
	/**
	 * Returns a new unit vector pointing in the specified direction.
	 */
	static up: Vector3;
	/**
	 * Returns a new unit vector pointing in the specified direction.
	 */
	static down: Vector3;
	/**
	 * Returns a new unit vector pointing in the specified direction.
	 */
	static forward: Vector3;
	/**
	 * Returns a new unit vector pointing in the specified direction.
	 */
	static backward: Vector3;
	/**
	 * Returns a new vector with all components equal to 0.
	 */
	static origin: Vector3;
	/**
	 * Creates a vector with a specified x component and a y and z component of 0.
	 * @param x - The x coordinate
	 */
	static x(x: number): Vector3;
	/**
	 * Creates a vector with a specified y component and an x and z component of 0.
	 * @param y - The y coordinate
	 */
	static y(y: number): Vector3;
	/**
	 * Creates a vector with a specified z component and an x and z component of 0.
	 * @param z - The z coordinate
	 */
	static z(z: number): Vector3;
}

/**
 * Represents a 4D vector.
 */
declare class Vector4 extends Vector {
	/**
	 * The counter-clockwise angle of the vector from the horizontal on the U-V plane. e.g. `vec.angleYZ` or `vec.angleYW`
	 */
	angleXY: number;
	/**
	 * The counter-clockwise angle of the vector from the horizontal on the U-V plane. e.g. `vec.angleYZ` or `vec.angleYW`
	 */
	angleXZ: number;
	/**
	 * The counter-clockwise angle of the vector from the horizontal on the U-V plane. e.g. `vec.angleYZ` or `vec.angleYW`
	 */
	angleXW: number;
	/**
	 * The counter-clockwise angle of the vector from the horizontal on the U-V plane. e.g. `vec.angleYZ` or `vec.angleYW`
	 */
	angleYZ: number;
	/**
	 * The counter-clockwise angle of the vector from the horizontal on the U-V plane. e.g. `vec.angleYZ` or `vec.angleYW`
	 */
	angleYW: number;
	/**
	 * The counter-clockwise angle of the vector from the horizontal on the U-V plane. e.g. `vec.angleYZ` or `vec.angleYW`
	 */
	angleZW: number;
	/**
	 * The modifiable elements of the vector, `["x", "y", "z", "w"]`
	 */
	static modValues: string[];
	/**
	 * Creates a new Vector4.
	 * @param x - The x component
	 * @param y - The y component
	 * @param z - The z component
	 * @param w - The w component
	 */
	constructor(x: number, y: number, z: number, w: number);
	/**
	 * Rotates the vector counter-clockwise on the U-V plane. This operation is in-place and returns the caller.
	 * e.g. `vec.rotateZW(0.3)`
	 * @param angle - The amount (in radians) to rotate by
	 */
	rotateXY(angle: number): this;
	/**
	 * Rotates the vector counter-clockwise on the U-V plane. This operation is in-place and returns the caller.
	 * e.g. `vec.rotateZW(0.3)`
	 * @param angle - The amount (in radians) to rotate by
	 */
	rotateXZ(angle: number): this;
	/**
	 * Rotates the vector counter-clockwise on the U-V plane. This operation is in-place and returns the caller.
	 * e.g. `vec.rotateZW(0.3)`
	 * @param angle - The amount (in radians) to rotate by
	 */
	rotateXW(angle: number): this;
	/**
	 * Rotates the vector counter-clockwise on the U-V plane. This operation is in-place and returns the caller.
	 * e.g. `vec.rotateZW(0.3)`
	 * @param angle - The amount (in radians) to rotate by
	 */
	rotateYZ(angle: number): this;
	/**
	 * Rotates the vector counter-clockwise on the U-V plane. This operation is in-place and returns the caller.
	 * e.g. `vec.rotateZW(0.3)`
	 * @param angle - The amount (in radians) to rotate by
	 */
	rotateYW(angle: number): this;
	/**
	 * Rotates the vector counter-clockwise on the U-V plane. This operation is in-place and returns the caller.
	 * e.g. `vec.rotateZW(0.3)`
	 * @param angle - The amount (in radians) to rotate by
	 */
	rotateZW(angle: number): this;
	/**
	 * Returns a copy of the vector rotated counter-clockwise on the U-V plane.
	 * @param angle - The amount (in radians) to rotate by
	 */
	rotatedXY(angle: number): this;
	/**
	 * Returns a copy of the vector rotated counter-clockwise on the U-V plane.
	 * @param angle - The amount (in radians) to rotate by
	 */
	rotatedXZ(angle: number): this;
	/**
	 * Returns a copy of the vector rotated counter-clockwise on the U-V plane.
	 * @param angle - The amount (in radians) to rotate by
	 */
	rotatedXW(angle: number): this;
	/**
	 * Returns a copy of the vector rotated counter-clockwise on the U-V plane.
	 * @param angle - The amount (in radians) to rotate by
	 */
	rotatedYZ(angle: number): this;
	/**
	 * Returns a copy of the vector rotated counter-clockwise on the U-V plane.
	 * @param angle - The amount (in radians) to rotate by
	 */
	rotatedYW(angle: number): this;
	/**
	 * Returns a copy of the vector rotated counter-clockwise on the U-V plane.
	 * @param angle - The amount (in radians) to rotate by
	 */
	rotatedZW(angle: number): this;
	/**
	 * Returns a new unit vector pointing in the specified direction.
	 */
	static left: Vector4;
	/**
	 * Returns a new unit vector pointing in the specified direction.
	 */
	static right: Vector4;
	/**
	 * Returns a new unit vector pointing in the specified direction.
	 */
	static up: Vector4;
	/**
	 * Returns a new unit vector pointing in the specified direction.
	 */
	static down: Vector4;
	/**
	 * Returns a new unit vector pointing in the specified direction.
	 */
	static forward: Vector4;
	/**
	 * Returns a new unit vector pointing in the specified direction.
	 */
	static backward: Vector4;
	/**
	 * Returns a new unit vector pointing in the specified direction.
	 */
	static before: Vector4;
	/**
	 * Returns a new unit vector pointing in the specified direction.
	 */
	static after: Vector4;
	/**
	 * Returns a new vector with all components equal to 0.
	 */
	static origin: Vector4;
	/**
	 * Creates a vector with a specified x component and a y, z, and w component of 0.
	 * @param x - The x coordinate
	 */
	static x(x: number): Vector4;
	/**
	 * Creates a vector with a specified y component and an x, z, and w component of 0.
	 * @param y - The y coordinate
	 */
	static y(y: number): Vector4;
	/**
	 * Creates a vector with a specified z component and an x, z, and w component of 0.
	 * @param z - The z coordinate
	 */
	static z(z: number): Vector4;
	/**
	 * Creates a vector with a specified w component and an x, y, and z component of 0.
	 * @param w - The w coordinate
	 */
	static w(w: number): Vector4;
}

/**
 * Represents a complex number of the form a + bi, where a and b are real numbers.
 * Multiplication and division (`times`, `over`, `mul`, `div`) are defined as they typically are for complex numbers, rather than the element-wise version provided by Operable.
 */
declare class Complex implements MathObject {
	/**
	 * The real component of the number (a)
	 */
	real: number;
	/**
	 * The imaginary component of the number (b)
	 */
	imaginary: number;
	/**
	 * The argument of the number
	 */
	angle: number;
	/**
	 * The length of the number
	 */
	norm: number;
	/**
	 * The squared length of the number
	 */
	sqrNorm: number;
	/**
	 * Creates a new complex number.
	 * @param real - The real component of the number
	 * @param imaginary - The imaginary component of the number. Default is 0
	 */
	constructor(real: number, imaginary?: number);
	/**
	 * Returns the complex conjugate of the number. For a number a + bi, the conjugate would be a - bi.
	 */
	get conjugate(): this;
	/**
	 * Rotates a vector by the argument of the caller, and then multiplies it by the length of the caller.
	 * @param vector - The vector to rotate
	 * @param dst - The destination to store the resulting vector in. If this is not specified, a new vector will be created
	 */
	rotate(vector: Vector2, dst?: Vector2): Vector2;
	/**
	 * Returns a matrix such that for a Complex `z` and Vector2 `v`, `z.rotate(v)` is the same as `z.toMatrix().times(v)`.
	 * @param result - The destination to store the resulting matrix in. If this is not specified, a new matrix will be created
	 */
	toMatrix(result?: Matrix2): Matrix2;
	/**
	 * Returns a unit complex number with a given angle to the real axis.
	 * @param angle - The argument of the number to create
	 */
	static fromRotation(angle: number): Complex;
	/**
	 * Returns the imaginary unit, i.
	 */
	static i: Complex;
	/**
	 * Computes the complex logarithm of a given value.
	 * @param value - The value to take the complex logarithm of
	 */
	static log(value: Complex): Complex;
	/**
	 * Computes the result of raising E to a given power.
	 * @param exponent - The power to raise E to
	 */
	static exp(exponent: Complex): Complex;
	/**
	 * Creates a complex number of the form re<sup>iθ</sup>.
	 * @param  - The argument (angle) of the complex number
	 * @param r - The length of the complex number. Default is 1
	 */
	static polar(θ: number, r?: number): Complex;
	/**
	 * Returns the reciprocal of the caller.
	 */
	get reciprocal(): this;
	/**
	 * Returns the inverse of the caller.
	 */
	get inverse(): this;
	/**
	 * Performs an operation between the caller and another object, and returns it.
	 * @param other - The right-hand side of the operation. This must be either the same type as the caller or a number
	 * @param result - The destination to store the resulting object in. If not specified, a new object will be created
	 */
	plus(other: this, result?: this): this;
	/**
	 * Performs an operation between the caller and another object, and returns it.
	 * @param other - The right-hand side of the operation. This must be either the same type as the caller or a number
	 * @param result - The destination to store the resulting object in. If not specified, a new object will be created
	 */
	minus(other: this, result?: this): this;
	/**
	 * Performs an operation between the caller and another object, and returns it.
	 * @param other - The right-hand side of the operation. This must be either the same type as the caller or a number
	 * @param result - The destination to store the resulting object in. If not specified, a new object will be created
	 */
	times(other: this, result?: this): this;
	/**
	 * Performs an operation between the caller and another object, and returns it.
	 * @param other - The right-hand side of the operation. This must be either the same type as the caller or a number
	 * @param result - The destination to store the resulting object in. If not specified, a new object will be created
	 */
	over(other: this, result?: this): this;
	/**
	 * Performs an operation between the caller and another object, and returns it.
	 * @param other - The right-hand side of the operation. This must be either the same type as the caller or a number
	 * @param result - The destination to store the resulting object in. If not specified, a new object will be created
	 */
	modBy(other: this, result?: this): this;
	/**
	 * Performs an operation between the caller and another object, and returns it.
	 * @param other - The right-hand side of the operation. This must be either the same type as the caller or a number
	 * @param result - The destination to store the resulting object in. If not specified, a new object will be created
	 */
	pow(other: this, result?: this): this;
	/**
	 * Peforms an operation between the caller and another object, stores the result in the caller, and returns it.
	 * @param other - The right-hand side of the operation. This must be either the same type as the caller or a number
	 */
	add(other: this): this;
	/**
	 * Peforms an operation between the caller and another object, stores the result in the caller, and returns it.
	 * @param other - The right-hand side of the operation. This must be either the same type as the caller or a number
	 */
	sub(other: this): this;
	/**
	 * Peforms an operation between the caller and another object, stores the result in the caller, and returns it.
	 * @param other - The right-hand side of the operation. This must be either the same type as the caller or a number
	 */
	mul(other: this): this;
	/**
	 * Peforms an operation between the caller and another object, stores the result in the caller, and returns it.
	 * @param other - The right-hand side of the operation. This must be either the same type as the caller or a number
	 */
	div(other: this): this;
	/**
	 * Peforms an operation between the caller and another object, stores the result in the caller, and returns it.
	 * @param other - The right-hand side of the operation. This must be either the same type as the caller or a number
	 */
	mod(other: this): this;
	/**
	 * Peforms an operation between the caller and another object, stores the result in the caller, and returns it.
	 * @param other - The right-hand side of the operation. This must be either the same type as the caller or a number
	 */
	exp(other: this): this;
	/**
	 * Replaces the caller with its reciprocal and returns it.
	 */
	flip(): this;
	/**
	 * Negates the caller and returns it.
	 */
	invert(): this;
	/**
	 * Replaces the content of the caller with that of a given MathObject of the same type, then returns the caller.
	 * @param source - The object from which to copy the data
	 */
	set(source: this): this;
	/**
	 * Returns whether the caller is equal, within a small tolerance, to another given object of the same type.
	 * @param other - The object to compare to
	 */
	equals(other: this): boolean;
	/**
	 * Returns a string representation of the object with a specified level of precision for included numbers.
	 * @param digits - The number of digits of precision
	 */
	toFixed(digits: number): string;
	/**
	 * Returns a string representation of the object with a specified maximum level of precision for included numbers.
	 * @param max - The maximum number of digits of precision. The displayed amount of digits may be less, since trailing zeroes are discarded
	 */
	toMaxed(max: number): string;
	/**
	 * Returns a value such that for any MathObject `a`, `a.plus(a.constructor.zero).equals(a)` is true.
	 */
	static zero: MathObject;
	/**
	 * Computes the sum of a collection of MathObjects of the same type.
	 * @param values - The values to sum
	 * @param result - The destination to store the resulting object in. If not specified, a new object will be created
	 */
	static sum(values: MathObject[], result?: MathObject): MathObject;
	/**
	 * Computes the average of a collection of MathObjects of the same type.
	 * @param values - The values to average.
	 * @param result - The destination to store the resulting object in. If not specified, a new object will be created
	 */
	static avg(values: MathObject[], result?: MathObject): MathObject;
	/**
	 * Creates a copy of the object and optionally stores it in a provided destination.
	 * @param destination - The destination to copy the object into. This must be the same type as the caller
	 */
	get(destination?: this): this;
}

/**
 * Represents a quaternion, a 4D extension of the imaginary numbers.
 * Each quaternion is a number of the form a + bi + cj + dk.
 * These can be used to represent 3D rotations via `Quaternion.fromRotation()` and `Quaternion.prototype.rotate()`.
 */
declare class Quaternion extends Complex {
	/**
	 * The real component of the quaternion
	 */
	real: number;
	/**
	 * The imaginary components of the quaternion. Each element of this vector corresponds to a coefficient on one of the imaginary units
	 */
	imaginary: Vector3;
	/**
	 * The quaternion's axis of rotation multiplied by its angle of rotation. Only defined for rotation-representing quaternions
	 */
	angle: Vector3;
	/**
	 * Creates a new quaternion.
	 * @param real - The real component of the quaternion.
	 * @param imaginary - The imaginary components of the quaternion. Default is (0, 0, 1).
	 */
	constructor(real: number, imaginary?: Vector3);
	/**
	 * Returns the imaginary components of the product of the caller, the provided vector, and the caller's conjugate (q(0, v)q*).
	 * For quaternions created with `Quaternion.fromRotation()`, this corresponds to a 3D rotation.
	 * @param vector - The vector to rotate
	 * @param dst - The destination to store the resulting vector in. If this is not specified, a new vector will be created
	 */
	rotate(vector: Vector3, dst?: Vector3): Vector3;
	/**
	 * Returns a matrix such that for a Quaternion `q` and Vector3 `v`, `q.rotate(v)` is the same as `q.toMatrix().times(v)`.
	 * @param result - The destination to store the resulting matrix in. If this is not specified, a new matrix will be created
	 */
	toMatrix(result?: Matrix3): Matrix3;
	/**
	 * Returns the first quaternion unit, i.
	 */
	static i: Quaternion;
	/**
	 * Returns the second quaternion unit, j.
	 */
	static j: Quaternion;
	/**
	 * Returns the third quaternion unit, k.
	 */
	static k: Quaternion;
	/**
	 * Returns a unit quaternion `q` such that for a Vector3 `v`, `q.rotate(v)` refers to `v` rotated counter-clockwise about the given axis by the given angle.
	 * @param axis - The normalized axis of rotation
	 * @param angle - The counter-clockwise angle of rotation
	 */
	static fromRotation(axis: Vector3, angle: number): Quaternion;
	/**
	 * Returns a unit quaternion `q` such that for a Vector3 `v`, `q.rotate(v)` refers to `v` rotated counter-clockwise about the given axis by the given angle.
	 * @param rotation - A vector with length equal to the angle of rotation and direction equal to the axis of rotation
	 */
	static fromRotation(rotation: Vector3): Quaternion;
}

/**
 * Contains a collection of useful static methods for manipulating 3D shapes and figures.
 * This class cannot be constructed.
 */
declare class Geometry3D {
	/**
	 * Subdivides a frustum along the z axis.
	 * @param frustum - The frustum to subdivide
	 * @param portions - How to slice the frustum. If this is a number, the frustum will be sliced into that many pieces of equal size. If this is an array, each element provides a weight proportional to the size of each piece of the frustum. The weights may be scaled by any constant
	 */
	static subdivideFrustum(frustum: Frustum, portions: number[] | number): Frustum[];
}

/**
 * Facilitates the creation of lazily-evaluated expressions.
 * ```js
 * const object = { };
 * Lazy.define(object, "lazy", () => { // an expensive operation
 * 	let result = 0;
 * 	for (let i = 0; i < 1e6; i++)
 * 		result += Random.random();
 * 	return result;
 * });
 * 
 * console.log(object.lazy); // takes a while
 * console.log(object.lazy); // cheap from now on
 * ```
 */
declare class Lazy {
	/**
	 * Defines a lazy-evaluated property of an object.
	 * The first access to the property will calculate the result, which will be cached and returned on all future accesses.
	 * @param obj - The target object for the property
	 * @param name - The key for the property
	 * @param calculateValue - The no-argument function used to initially compute the value.
	 */
	static define(obj: object, name: string, calculateValue: () => any): void;
}

/**
 * Represents a mathematical object, on which operations (+, -, *, /, %, **) can be performed.
 * The operations are provided as two sets of methods, one which mutates the caller, and one which creates a new object to hold the result.
 * ```js
 * new Complex(3, 6).over(3) // 1 + 2i
 * new Vector3(1, 2, 3).plus(3) // (4, 5, 6)
 * Quaternion.fromRotation(Vector3.up, Math.PI) // 0 + 0i + -1j + 0k
 * ```
 * This is an abstract superclass and should not be constructed.
 */
declare interface MathObject implements Copyable {
	/**
	 * Returns the reciprocal of the caller.
	 */
	get reciprocal(): this;
	/**
	 * Returns the inverse of the caller.
	 */
	get inverse(): this;
	/**
	 * Performs an operation between the caller and another object, and returns it.
	 * @param other - The right-hand side of the operation. This must be either the same type as the caller or a number
	 * @param result - The destination to store the resulting object in. If not specified, a new object will be created
	 */
	plus(other: this, result?: this): this;
	/**
	 * Performs an operation between the caller and another object, and returns it.
	 * @param other - The right-hand side of the operation. This must be either the same type as the caller or a number
	 * @param result - The destination to store the resulting object in. If not specified, a new object will be created
	 */
	minus(other: this, result?: this): this;
	/**
	 * Performs an operation between the caller and another object, and returns it.
	 * @param other - The right-hand side of the operation. This must be either the same type as the caller or a number
	 * @param result - The destination to store the resulting object in. If not specified, a new object will be created
	 */
	times(other: this, result?: this): this;
	/**
	 * Performs an operation between the caller and another object, and returns it.
	 * @param other - The right-hand side of the operation. This must be either the same type as the caller or a number
	 * @param result - The destination to store the resulting object in. If not specified, a new object will be created
	 */
	over(other: this, result?: this): this;
	/**
	 * Performs an operation between the caller and another object, and returns it.
	 * @param other - The right-hand side of the operation. This must be either the same type as the caller or a number
	 * @param result - The destination to store the resulting object in. If not specified, a new object will be created
	 */
	modBy(other: this, result?: this): this;
	/**
	 * Performs an operation between the caller and another object, and returns it.
	 * @param other - The right-hand side of the operation. This must be either the same type as the caller or a number
	 * @param result - The destination to store the resulting object in. If not specified, a new object will be created
	 */
	pow(other: this, result?: this): this;
	/**
	 * Peforms an operation between the caller and another object, stores the result in the caller, and returns it.
	 * @param other - The right-hand side of the operation. This must be either the same type as the caller or a number
	 */
	add(other: this): this;
	/**
	 * Peforms an operation between the caller and another object, stores the result in the caller, and returns it.
	 * @param other - The right-hand side of the operation. This must be either the same type as the caller or a number
	 */
	sub(other: this): this;
	/**
	 * Peforms an operation between the caller and another object, stores the result in the caller, and returns it.
	 * @param other - The right-hand side of the operation. This must be either the same type as the caller or a number
	 */
	mul(other: this): this;
	/**
	 * Peforms an operation between the caller and another object, stores the result in the caller, and returns it.
	 * @param other - The right-hand side of the operation. This must be either the same type as the caller or a number
	 */
	div(other: this): this;
	/**
	 * Peforms an operation between the caller and another object, stores the result in the caller, and returns it.
	 * @param other - The right-hand side of the operation. This must be either the same type as the caller or a number
	 */
	mod(other: this): this;
	/**
	 * Peforms an operation between the caller and another object, stores the result in the caller, and returns it.
	 * @param other - The right-hand side of the operation. This must be either the same type as the caller or a number
	 */
	exp(other: this): this;
	/**
	 * Replaces the caller with its reciprocal and returns it.
	 */
	flip(): this;
	/**
	 * Negates the caller and returns it.
	 */
	invert(): this;
	/**
	 * Replaces the content of the caller with that of a given MathObject of the same type, then returns the caller.
	 * @param source - The object from which to copy the data
	 */
	set(source: this): this;
	/**
	 * Returns whether the caller is equal, within a small tolerance, to another given object of the same type.
	 * @param other - The object to compare to
	 */
	equals(other: this): boolean;
	/**
	 * Returns a string representation of the object with a specified level of precision for included numbers.
	 * @param digits - The number of digits of precision
	 */
	toFixed(digits: number): string;
	/**
	 * Returns a string representation of the object with a specified maximum level of precision for included numbers.
	 * @param max - The maximum number of digits of precision. The displayed amount of digits may be less, since trailing zeroes are discarded
	 */
	toMaxed(max: number): string;
	/**
	 * Returns a value such that for any MathObject `a`, `a.plus(a.constructor.zero).equals(a)` is true.
	 */
	static zero: MathObject;
	/**
	 * Computes the sum of a collection of MathObjects of the same type.
	 * @param values - The values to sum
	 * @param result - The destination to store the resulting object in. If not specified, a new object will be created
	 */
	static sum(values: MathObject[], result?: MathObject): MathObject;
	/**
	 * Computes the average of a collection of MathObjects of the same type.
	 * @param values - The values to average.
	 * @param result - The destination to store the resulting object in. If not specified, a new object will be created
	 */
	static avg(values: MathObject[], result?: MathObject): MathObject;
	/**
	 * Creates a copy of the object and optionally stores it in a provided destination.
	 * @param destination - The destination to copy the object into. This must be the same type as the caller
	 */
	get(destination?: this): this;
}

/**
 * Represents a composite mathematical object which element-wise operations can be performed on.
 * This is an abstract superclass and should not be constructed.
 */
declare class Operable implements MathObject, Serializable {
	/**
	 * The names of the elements in the operable. The order of this array also determines the order of the elements (e.g. `["x", "y"]` for Vector2)
	 */
	static modValues: string[];
	/**
	 * Produces a list of all the elements of the operable.
	 */
	get values(): number[];
	/**
	 * Sets all elements of the operable, either by copying from another operable, or by using a list of numeric values.
	 * Returns the caller.
	 * @param other - The operable to copy values from
	 * @param fill - A value to fill missing elements with. Default is 0
	 */
	set(other: this, fill?: number): this;
	/**
	 * Sets all elements of the operable, either by copying from another operable, or by using a list of numeric values.
	 * Returns the caller.
	 * @param elements - The new element values
	 */
	set(...elements: number[]): this;
	/**
	 * Retrieves a single element value from the operable.
	 * @param index - The element index
	 */
	at(index: number): number;
	/**
	 * Computes the sum of all the elements of the operable.
	 */
	total(): number;
	/**
	 * Checks equality between the operable and another operable of the same type.
	 * @param other - The operable to compare to
	 */
	equals(other: this): boolean;
	/**
	 * Remaps an operable from one range to another range.
	 * @param value - The operable to be remapped
	 * @param initialMin - The minimum of the range the value is in
	 * @param initialMax - The maximum of the range the value is in
	 * @param finalMin - The minimum of the desired range
	 * @param finalMax - The maximum of the desired range
	 */
	static remap(value: Operable, initialMin: Operable, initialMax: Operable, finalMin: Operable, finalMax: Operable): Operable;
	/**
	 * Returns an operable clamped element-wise between two bounds.
	 * Equivalent to `Operable.max(min, operable.min(max, value))`.
	 * @param value - The value to clamp
	 * @param min - The lower bound for the result
	 * @param max - The upper bound for the result
	 */
	static clamp(value: Operable, min: Operable, max: Operable): Operable;
	/**
	 * Produces an operable with all elements equal to a single value.
	 * @param value - The value that will be used for all elements
	 */
	static filled(value: number): Operable;
	/**
	 * Finds and returns the element-wise minimum of a series of values.
	 * @param values - The values to compare
	 */
	static min(...values: Operable[] | number[]): Operable;
	/**
	 * Finds and returns the element-wise maximum of a series of values.
	 * @param values - The values to compare
	 */
	static max(...values: Operable[] | number[]): Operable;
	/**
	 * Performs a built-in unary Math operation element-wise on an operable.
	 * @param value - The operable to operate on
	 */
	static round(value: Operable): Operable;
	/**
	 * Performs a built-in unary Math operation element-wise on an operable.
	 * @param value - The operable to operate on
	 */
	static floor(value: Operable): Operable;
	/**
	 * Performs a built-in unary Math operation element-wise on an operable.
	 * @param value - The operable to operate on
	 */
	static ceil(value: Operable): Operable;
	/**
	 * Performs a built-in unary Math operation element-wise on an operable.
	 * @param value - The operable to operate on
	 */
	static trunc(value: Operable): Operable;
	/**
	 * Performs a built-in unary Math operation element-wise on an operable.
	 * @param value - The operable to operate on
	 */
	static abs(value: Operable): Operable;
	/**
	 * Performs a built-in unary Math operation element-wise on an operable.
	 * @param value - The operable to operate on
	 */
	static sqrt(value: Operable): Operable;
	/**
	 * Performs a built-in unary Math operation element-wise on an operable.
	 * @param value - The operable to operate on
	 */
	static log(value: Operable): Operable;
	/**
	 * Performs a built-in unary Math operation element-wise on an operable.
	 * @param value - The operable to operate on
	 */
	static log2(value: Operable): Operable;
	/**
	 * Performs a built-in unary Math operation element-wise on an operable.
	 * @param value - The operable to operate on
	 */
	static log10(value: Operable): Operable;
	/**
	 * Performs a built-in unary Math operation element-wise on an operable.
	 * @param value - The operable to operate on
	 */
	static sin(value: Operable): Operable;
	/**
	 * Performs a built-in unary Math operation element-wise on an operable.
	 * @param value - The operable to operate on
	 */
	static cos(value: Operable): Operable;
	/**
	 * Performs a built-in unary Math operation element-wise on an operable.
	 * @param value - The operable to operate on
	 */
	static tan(value: Operable): Operable;
	/**
	 * Performs a built-in unary Math operation element-wise on an operable.
	 * @param value - The operable to operate on
	 */
	static sinh(value: Operable): Operable;
	/**
	 * Performs a built-in unary Math operation element-wise on an operable.
	 * @param value - The operable to operate on
	 */
	static cosh(value: Operable): Operable;
	/**
	 * Performs a built-in unary Math operation element-wise on an operable.
	 * @param value - The operable to operate on
	 */
	static tanh(value: Operable): Operable;
	/**
	 * Performs a built-in unary Math operation element-wise on an operable.
	 * @param value - The operable to operate on
	 */
	static asin(value: Operable): Operable;
	/**
	 * Performs a built-in unary Math operation element-wise on an operable.
	 * @param value - The operable to operate on
	 */
	static acos(value: Operable): Operable;
	/**
	 * Performs a built-in unary Math operation element-wise on an operable.
	 * @param value - The operable to operate on
	 */
	static atan(value: Operable): Operable;
	/**
	 * Performs a built-in unary Math operation element-wise on an operable.
	 * @param value - The operable to operate on
	 */
	static asinh(value: Operable): Operable;
	/**
	 * Performs a built-in unary Math operation element-wise on an operable.
	 * @param value - The operable to operate on
	 */
	static acosh(value: Operable): Operable;
	/**
	 * Performs a built-in unary Math operation element-wise on an operable.
	 * @param value - The operable to operate on
	 */
	static atanh(value: Operable): Operable;
	/**
	 * Performs a built-in unary Math operation element-wise on an operable.
	 * @param value - The operable to operate on
	 */
	static sign(value: Operable): Operable;
	/**
	 * Returns the reciprocal of the caller.
	 */
	get reciprocal(): this;
	/**
	 * Returns the inverse of the caller.
	 */
	get inverse(): this;
	/**
	 * Performs an operation between the caller and another object, and returns it.
	 * @param other - The right-hand side of the operation. This must be either the same type as the caller or a number
	 * @param result - The destination to store the resulting object in. If not specified, a new object will be created
	 */
	plus(other: this, result?: this): this;
	/**
	 * Performs an operation between the caller and another object, and returns it.
	 * @param other - The right-hand side of the operation. This must be either the same type as the caller or a number
	 * @param result - The destination to store the resulting object in. If not specified, a new object will be created
	 */
	minus(other: this, result?: this): this;
	/**
	 * Performs an operation between the caller and another object, and returns it.
	 * @param other - The right-hand side of the operation. This must be either the same type as the caller or a number
	 * @param result - The destination to store the resulting object in. If not specified, a new object will be created
	 */
	times(other: this, result?: this): this;
	/**
	 * Performs an operation between the caller and another object, and returns it.
	 * @param other - The right-hand side of the operation. This must be either the same type as the caller or a number
	 * @param result - The destination to store the resulting object in. If not specified, a new object will be created
	 */
	over(other: this, result?: this): this;
	/**
	 * Performs an operation between the caller and another object, and returns it.
	 * @param other - The right-hand side of the operation. This must be either the same type as the caller or a number
	 * @param result - The destination to store the resulting object in. If not specified, a new object will be created
	 */
	modBy(other: this, result?: this): this;
	/**
	 * Performs an operation between the caller and another object, and returns it.
	 * @param other - The right-hand side of the operation. This must be either the same type as the caller or a number
	 * @param result - The destination to store the resulting object in. If not specified, a new object will be created
	 */
	pow(other: this, result?: this): this;
	/**
	 * Peforms an operation between the caller and another object, stores the result in the caller, and returns it.
	 * @param other - The right-hand side of the operation. This must be either the same type as the caller or a number
	 */
	add(other: this): this;
	/**
	 * Peforms an operation between the caller and another object, stores the result in the caller, and returns it.
	 * @param other - The right-hand side of the operation. This must be either the same type as the caller or a number
	 */
	sub(other: this): this;
	/**
	 * Peforms an operation between the caller and another object, stores the result in the caller, and returns it.
	 * @param other - The right-hand side of the operation. This must be either the same type as the caller or a number
	 */
	mul(other: this): this;
	/**
	 * Peforms an operation between the caller and another object, stores the result in the caller, and returns it.
	 * @param other - The right-hand side of the operation. This must be either the same type as the caller or a number
	 */
	div(other: this): this;
	/**
	 * Peforms an operation between the caller and another object, stores the result in the caller, and returns it.
	 * @param other - The right-hand side of the operation. This must be either the same type as the caller or a number
	 */
	mod(other: this): this;
	/**
	 * Peforms an operation between the caller and another object, stores the result in the caller, and returns it.
	 * @param other - The right-hand side of the operation. This must be either the same type as the caller or a number
	 */
	exp(other: this): this;
	/**
	 * Replaces the caller with its reciprocal and returns it.
	 */
	flip(): this;
	/**
	 * Negates the caller and returns it.
	 */
	invert(): this;
	/**
	 * Replaces the content of the caller with that of a given MathObject of the same type, then returns the caller.
	 * @param source - The object from which to copy the data
	 */
	set(source: this): this;
	/**
	 * Returns whether the caller is equal, within a small tolerance, to another given object of the same type.
	 * @param other - The object to compare to
	 */
	equals(other: this): boolean;
	/**
	 * Returns a string representation of the object with a specified level of precision for included numbers.
	 * @param digits - The number of digits of precision
	 */
	toFixed(digits: number): string;
	/**
	 * Returns a string representation of the object with a specified maximum level of precision for included numbers.
	 * @param max - The maximum number of digits of precision. The displayed amount of digits may be less, since trailing zeroes are discarded
	 */
	toMaxed(max: number): string;
	/**
	 * Returns a value such that for any MathObject `a`, `a.plus(a.constructor.zero).equals(a)` is true.
	 */
	static zero: MathObject;
	/**
	 * Computes the sum of a collection of MathObjects of the same type.
	 * @param values - The values to sum
	 * @param result - The destination to store the resulting object in. If not specified, a new object will be created
	 */
	static sum(values: MathObject[], result?: MathObject): MathObject;
	/**
	 * Computes the average of a collection of MathObjects of the same type.
	 * @param values - The values to average.
	 * @param result - The destination to store the resulting object in. If not specified, a new object will be created
	 */
	static avg(values: MathObject[], result?: MathObject): MathObject;
	/**
	 * Creates a copy of the object and optionally stores it in a provided destination.
	 * @param destination - The destination to copy the object into. This must be the same type as the caller
	 */
	get(destination?: this): this;
	/**
	 * Writes the object to a buffer and returns it.
	 * @param buffer - A destination buffer to write the result to. If not specified, a new buffer will be created
	 */
	toByteBuffer(buffer?: ByteBuffer): ByteBuffer;
	/**
	 * Creates an instance of the class based on data read from the current pointed-to location in a buffer. This increments the buffer's pointer to after the data of the instance.
	 * @param buffer - A source buffer to read the data from
	 */
	static fromByteBuffer(buffer: ByteBuffer): Serializable;
}

/**
 * Subclasses of this class represent a set of unique symbolic values.
 * This is an abstract superclass and should not be constructed.
 * ```js
 * const Options = Enum.define("YES", "NO", "MAYBE");
 * const answer = Options.YES;
 * ```
 */
declare class Enum {
	/**
	 * The name of the symbol. This property is read-only
	 */
	name: string;
	/**
	 * Returns the name of the symbolic value.
	 */
	toString(): string;
	/**
	 * Creates a new subclass of Enum based on a specific set of unique names.
	 * Static properties with these names will be defined on the return value and will contain the associated symbolic values.
	 * @param names - The names for the symbolic values
	 */
	static define(...names: string[]): Class<Enum>;
}

/**
 * Classes that implement this interface can be copied with perfect fidelity.
 */
declare interface Copyable {
	/**
	 * Creates a copy of the object and optionally stores it in a provided destination.
	 * @param destination - The destination to copy the object into. This must be the same type as the caller
	 */
	get(destination?: this): this;
}

/**
 * 
 */
declare interface Boolean extends Serializable {
	/**
	 * Writes the object to a buffer and returns it.
	 * @param buffer - A destination buffer to write the result to. If not specified, a new buffer will be created
	 */
	toByteBuffer(buffer?: ByteBuffer): ByteBuffer;
	/**
	 * Creates an instance of the class based on data read from the current pointed-to location in a buffer. This increments the buffer's pointer to after the data of the instance.
	 * @param buffer - A source buffer to read the data from
	 */
	static fromByteBuffer(buffer: ByteBuffer): Serializable;
}

/**
 * 
 */
declare interface Object extends Serializable {
	/**
	 * Writes the object to a buffer and returns it.
	 * @param buffer - A destination buffer to write the result to. If not specified, a new buffer will be created
	 */
	toByteBuffer(buffer?: ByteBuffer): ByteBuffer;
	/**
	 * Creates an instance of the class based on data read from the current pointed-to location in a buffer. This increments the buffer's pointer to after the data of the instance.
	 * @param buffer - A source buffer to read the data from
	 */
	static fromByteBuffer(buffer: ByteBuffer): Serializable;
}

/**
 * The built-in Array class has some additional quality-of-life methods in the Hengine.
 */
declare interface Array<T> {
	/**
	 * The last element of the array
	 */
	last: any;
	/**
	 * Pushes each element in an array to the end of the caller.
	 * @param array - The array to add to the end
	 */
	pushArray(array: any[]): void;
	/**
	 * Creates a multidimensional array, on which standard array operations can be performed with additional arguments.
	 * e.g. `arr.map((value, i, j) => ...)` for a 2D array.
	 * @param dims - The sizes of the each dimension of the array.
	 */
	static dim(...dims: number[]): any[];
}

/**
 * The built-in Number class has some additional utility methods in the Hengine.
 * Numbers are Vectors in the sense that they have all the same methods, except that those which modify the caller in-place are not defined.
 */
declare interface Number extends MathObject {
	/**
	 * Returns the caller (interpreted as radians) converted to degrees.
	 */
	toDegrees(): number;
	/**
	 * Returns the caller (interpreted as degrees) converted to radians.
	 */
	toRadians(): number;
}

/**
 * The built-in String class has some additional utility methods in the Hengine.
 */
declare interface String extends Serializable {
	/**
	 * Returns a copy of the caller with the first character capitalized.
	 */
	capitalize(): string;
	/**
	 * Returns the caller split along the first instance of a substring.
	 * If the substring is not found, it will return an array containing the caller as the first element and the empty string as the second.
	 * @param boundary - The substring to split on
	 */
	cut(boundary: string): string[];
	/**
	 * Downloads the contents of the string as a `.txt` file.
	 * Returns a promise that resolves when the file downloads.
	 * @param name - The base name of the file to download. The resulting file with be named by this argument, followed by the extension argument. Default is "string"
	 * @param extension - The extension for the downloaded file. Default is "txt"
	 */
	download(name?: string, extension?: string): Promise;
	/**
	 * Returns the caller with each line indented by a single tab character.
	 */
	indent(): string;
	/**
	 * Writes the object to a buffer and returns it.
	 * @param buffer - A destination buffer to write the result to. If not specified, a new buffer will be created
	 */
	toByteBuffer(buffer?: ByteBuffer): ByteBuffer;
	/**
	 * Creates an instance of the class based on data read from the current pointed-to location in a buffer. This increments the buffer's pointer to after the data of the instance.
	 * @param buffer - A source buffer to read the data from
	 */
	static fromByteBuffer(buffer: ByteBuffer): Serializable;
}

/**
 * The storage class has some additional quality-of-life methods in the Hengine designed to promote safe usage.
 */
declare interface Storage {
	/**
	 * Downloads a JSON backup of the storage object.
	 * @param file - The base name of the backup file. The default is `"backup"`
	 */
	downloadBackup(file?: string): void;
	/**
	 * Clears the storage object after asking permission from the user.
	 * If permission is given, a backup will be downloaded before the storage object is cleared.
	 * Returns whether or not the clearing succeeded.
	 * @param file - The base name of the backup file. The default is `"backup"`
	 */
	clear(file?: string): boolean;
	/**
	 * Replaces the current content of the storage object with a user-selected JSON backup.
	 * Before the file dialog is opened, this will call `.clear()`, which will ask permission and download a backup. If permission is not given, the entire upload operation will be canceled.
	 */
	uploadBackup(): void;
}

/**
 * Represents a frame-by-frame animation.
 * These should be loaded using HengineAnimationResource and should not be constructed directly.
 * For the purposes of the animation, a frame elapses each time the animation is drawn.
 * ```js
 * const catKnead = loadResource("catKnead"); // load the Animation
 * 
 * intervals.continuous(() => {
 * 	renderer.image(catKnead).default(0, 0); // the animation will advance
 * });
 * ```
 */
declare class Animation extends ImageType implements Copyable {
	/**
	 * The images that make up the animation
	 */
	frames: ImageType[];
	/**
	 * Whether or not the animation will advance to the next frame when drawn. Starts as true
	 */
	autoAdvance: boolean;
	/**
	 * Whether or not the animation will reset to the beginning after completing
	 */
	loops: boolean;
	/**
	 * The number of frames each animation frame will be visible for
	 */
	delay: number;
	/**
	 * The current progress (in frames) of the animation
	 */
	timer: number;
	/**
	 * The total amount of frames it will take the animation to complete
	 */
	totalTime: number;
	/**
	 * A function to be called when the animation completes (this will be called even if the animation loops)
	 */
	onEnd: () => void;
	/**
	 * Creates a new animation from a given set of frames.
	 * @param frames - The frames of the animation
	 * @param delay - The delay (in frames) between each frame
	 * @param loops - Whether or not the animation loops
	 * @param onEnd - A function to be called when the animation completes. Default is a no-op
	 */
	constructor(frames: ImageType[], delay: number, loops: boolean, onEnd?: () => void);
	/**
	 * Returns whether or not the animation has completed.
	 * If the animation loops, this will always return false.
	 */
	get done(): boolean;
	/**
	 * Advances the animation by one update cycle.
	 */
	advance(): void;
	/**
	 * Pauses playback of the animation.
	 */
	stop(): void;
	/**
	 * Resumes playback of the animation.
	 */
	start(): void;
	/**
	 * Restarts the animation.
	 */
	reset(): void;
	/**
	 * Creates a new animation based on a horizontal sprite sheet containing the frames directly next to each other.
	 * @param spritesheet - The image containing all the frames
	 * @param imgWidth - The width (in pixels) of each frame
	 * @param imgHeight - The height (in pixels) of each frame
	 * @param delay - The amount of frames each animation frame is visible for
	 * @param loops - Whether or not the animation loops. Default is true
	 * @param onEnd - A function to execute when the animation completes. Default is a no-op
	 */
	static fromImage(spritesheet: ImageType, imgWidth: number, imgHeight: number, delay: number, loops?: boolean, onEnd?: () => void): Animation;
	/**
	 * Creates a copy of the object and optionally stores it in a provided destination.
	 * @param destination - The destination to copy the object into. This must be the same type as the caller
	 */
	get(destination?: this): this;
}

/**
 * Represents a collection of animations that play at different times.
 * This is modelled using a collection of states (which can be of any type(s)), that can have different associated animations.
 * This also allows for transition animations between states.
 */
declare class AnimationStateMachine extends ImageType {
	/**
	 * Creates a new AnimationStateMachine.
	 * @param stateAnimations - The Animations corresponding to each state.
	 * @param initialState - The initial state
	 */
	constructor(stateAnimations: Map<any, Animation>, initialState: any);
	/**
	 * Sets the state of the state machine.
	 * @param state - The new state of the state machine
	 */
	set state(state: any);
	/**
	 * Returns the current state of the state machine.
	 */
	get state(): any;
	/**
	 * Makes a state exit when its animation completes. This will only work if the animation doesn't loop.
	 * @param state - The state that will exit
	 */
	exitOnDone(state: any): void;
	/**
	 * Adds an animation to be played when transitioning between two specified states.
	 * @param initial - The state being transitioned from
	 * @param final - The state being transitioned to
	 * @param animation - The animation to play during this time. `.loops` must be false
	 */
	addTransition(initial: any, final: any, animation: Animation): void;
}

/**
 * Represents a camera in a scene targeting a specific rendering surface.
 * The transformation represented by this matrix is from World-Space to Camera-Space.
 * `Vector` in the context of this class refers to either `Vector2` or `Vector3` depending on whether Camera2D or Camera3D is used.
 * Changes to camera position and orientation should be made before the screen is cleared, to avoid objects being rendered from multiple different camera positions over the course of the frame.
 */
declare interface Camera<Vector> extends Matrix {
	/**
	 * The location of the camera in World-Space
	 */
	position: Vector;
	/**
	 * The magnification level of the camera
	 */
	zoom: number;
	/**
	 * The clockwise roll (in radians) of the camera. Starts at 0
	 */
	rotation: number;
	/**
	 * Returns the caller.
	 */
	get matrix(): Matrix;
	/**
	 * Sets the zoom to 1.
	 */
	restoreZoom(): void;
	/**
	 * Zooms in by a specified amount.
	 * @param amount - The amount to zoom in by
	 */
	zoomIn(amount: number): void;
	/**
	 * Zooms out by a specified amount.
	 * @param amount - The amount to zoom out by
	 */
	zoomOut(amount: number): void;
	/**
	 * Multiplies the current zoom value.
	 * @param factor - The amount to multiply the current zoom
	 */
	zoomBy(factor: number): void;
	/**
	 * Maps a given point from Camera-Space to World-Space.
	 * @param point - The point to transform
	 */
	cameraToWorld(point: Vector): Vector;
	/**
	 * Maps a given point from World-Space to Camera-Space.
	 * @param point - The point to transform
	 */
	worldToCamera(point: Vector): Vector;
	/**
	 * Assuming the renderer is currently in Camera-Space, transforms to World-Space, calls a rendering function, and then transforms back to Camera-Space.
	 * @param render - The function to call while in the World-Space context
	 */
	drawInWorldSpace(render: () => void): void;
	/**
	 * Assuming the renderer is currently in World-Space, transforms to Camera-Space, calls a rendering function, and then transforms back to World-Space.
	 * @param render - The function to call while in the Camera-Space context
	 */
	drawInCameraSpace(render: () => void): void;
}

/**
 * Represents the camera in a 2D scene.
 */
declare class Camera2D extends Matrix3 implements Camera<Vector2> {
	/**
	 * Creates a new camera pointing to the middle of the provided renderer.
	 * @param canvas - The rendering surface to target
	 */
	constructor(canvas: ImageType);
	/**
	 * Smoothly moves the camera toward a new rotation value.
	 * @param angle - The new rotation to move toward (in radians)
	 * @param ferocity - The degree to which the camera should move toward the new position, on [0, 1]
	 */
	rotateTowards(angle: number, ferocity: number): void;
	/**
	 * Smoothly moves the camera toward a new position value.
	 * @param point - The new position to move toward
	 * @param ferocity - The degree to which the camera should move toward the new position, on [0, 1]
	 */
	moveTowards(point: Vector2, ferocity: number): void;
	/**
	 * Moves the camera such that the entire viewport is entire a given axis-aligned rectangular boundary.
	 * If the boundary is smaller than the viewport, the behavior is undefined.
	 * @param boundary - The boundary in which the camera's viewport must exist
	 */
	constrain(boundary: Rect): void;
	/**
	 * Moves the camera such that the entire viewport is entire a given axis-aligned rectangular boundary.
	 * If the boundary is smaller than the viewport, the behavior is undefined.
	 * @param x - The x coordinate of the upper-left corner of the boundary
	 * @param y - The y coordinate of the upper-left corner of the boundary
	 * @param width - The width of the boundary
	 * @param height - The height of the boundary
	 */
	constrain(x: number, y: number, width: number, height: number): void;
	/**
	 * Zooms in/out about a specific point (in World-Space) by a specific factor.
	 * @param center - The zoom center
	 * @param factor - The zoom multiplier
	 */
	zoomAbout(center: Vector2, factor: number): void;
	/**
	 * Returns the axis-aligned bounding box of the current viewport.
	 */
	get screen(): Rect;
	/**
	 * The location of the camera in World-Space
	 */
	position: Vector;
	/**
	 * The magnification level of the camera
	 */
	zoom: number;
	/**
	 * The clockwise roll (in radians) of the camera. Starts at 0
	 */
	rotation: number;
	/**
	 * Returns the caller.
	 */
	get matrix(): Matrix;
	/**
	 * Sets the zoom to 1.
	 */
	restoreZoom(): void;
	/**
	 * Zooms in by a specified amount.
	 * @param amount - The amount to zoom in by
	 */
	zoomIn(amount: number): void;
	/**
	 * Zooms out by a specified amount.
	 * @param amount - The amount to zoom out by
	 */
	zoomOut(amount: number): void;
	/**
	 * Multiplies the current zoom value.
	 * @param factor - The amount to multiply the current zoom
	 */
	zoomBy(factor: number): void;
	/**
	 * Maps a given point from Camera-Space to World-Space.
	 * @param point - The point to transform
	 */
	cameraToWorld(point: Vector): Vector;
	/**
	 * Maps a given point from World-Space to Camera-Space.
	 * @param point - The point to transform
	 */
	worldToCamera(point: Vector): Vector;
	/**
	 * Assuming the renderer is currently in Camera-Space, transforms to World-Space, calls a rendering function, and then transforms back to Camera-Space.
	 * @param render - The function to call while in the World-Space context
	 */
	drawInWorldSpace(render: () => void): void;
	/**
	 * Assuming the renderer is currently in World-Space, transforms to Camera-Space, calls a rendering function, and then transforms back to World-Space.
	 * @param render - The function to call while in the Camera-Space context
	 */
	drawInCameraSpace(render: () => void): void;
}

/**
 * Represents a color to be used in rendering.
 * It is stored as an RGB triple with an additional opacity component.
 */
declare class Color extends Operable {
	/**
	 * The red component of the color, on [0, 255]
	 */
	red: number;
	/**
	 * The green component of the color, on [0, 255]
	 */
	green: number;
	/**
	 * The blue component of the color, on [0, 255]
	 */
	blue: number;
	/**
	 * The alpha (opacity) component of the color, on [0, 1]
	 */
	alpha: number;
	/**
	 * Whether or not all the color's channels will be clamped within their respective bounds after all operations. This starts as true
	 */
	limited: boolean;
	/**
	 * The grayscale intensity of the color, on [0, 1]
	 */
	brightness: number;
	/**
	 * The numeric components of the color, `["red", "green", "blue", "alpha"]`
	 */
	static modValues: string[];
	/**
	 * The smallest visually meaningful change in alpha, 1/255.
	 */
	static EPSILON: number;
	/**
	 * Creates a new Color.
	 * @param color - Any valid CSS color representation
	 */
	constructor(color: string);
	/**
	 * Creates a new Color.
	 * @param red - The red component of the color, on [0, 255]
	 * @param green - The green component of the color, on [0, 255]
	 * @param blue - The blue component of the color, on [0, 255]
	 * @param alpha - The alpha (opacity) component of the color, on [0, 1]. Default is 1
	 */
	constructor(red: number, green: number, blue: number, alpha?: number);
	/**
	 * Returns a copy of the color with an alpha of 1.
	 */
	get opaque(): this;
	/**
	 * Returns the inverse of the caller, with the same alpha as the caller.
	 * The inverse is defined as white minus the caller.
	 */
	get inverse(): this;
	/**
	 * Returns the CSS rgba color string representing the color. 
	 */
	getRGBA(): string;
	/**
	 * Returns the CSS hex color string representing the color. 
	 */
	getHex(): string;
	/**
	 * Returns the GLSL vec4 string representing the color. 
	 */
	getGLSL(): string;
	/**
	 * Returns a valid CSS string representation of the color.
	 */
	toString(): string;
	/**
	 * Returns a copy of a specified color with a specified alpha.
	 * @param color - The color to use for the RGB portion of the result
	 * @param alpha - The new alpha value
	 */
	static alpha(color: Color, alpha: number): Color;
	/**
	 * Returns a copy of a color with a specified change in saturation.
	 * @param color - The base color
	 * @param factor - The multiplier on the current saturation of the color
	 */
	static saturate(color: Color, factor: number): Color;
	/**
	 * Returns a new grayscale color with a specified brightness.
	 * @param intensity - The grayscale intensity on [0, 1]
	 */
	static grayScale(intensity: number): Color;
	/**
	 * Creates a new color whose channels aren't clamped within the normal range (`.limited = false`).
	 * @param red - The red channel of the color on [0, 255]. Default is 0
	 * @param green - The green channel of the color on [0, 255]. Default is 0
	 * @param blue - The blue channel of the color on [0, 255]. Default is 0
	 * @param alpha - The alpha channel of the color on [0, 1]. Default is 1
	 */
	static unlimited(red?: number, green?: number, blue?: number, alpha?: number): Color;
}

/**
 * Represents a font, including family, side, and styling.
 * Fonts can be used in the text rendering functions of Artist.
 * ```js
 * const font = new Font(15, "Consolas", false, true); // italic 15px Consolas
 * 
 * renderer.draw(new Color("black")).text(font, "Hello World!", 0, 0);
 * ```
 */
declare class Font implements Copyable {
	/**
	 * The size of the font in CSS pixels
	 */
	size: number;
	/**
	 * The string identifier for the font family
	 */
	family: string;
	/**
	 * Whether the font is bold
	 */
	bold: boolean;
	/**
	 * Whether the font is italic
	 */
	italic: boolean;
	/**
	 * The height of a line of text in the font. This determines spacing between multiline strings
	 */
	lineHeight: number;
	/**
	 * The number of spaces a tab is equivalent to for this font
	 */
	tabSize: number;
	/**
	 * These are premade fonts of four common families ("Serif", "Arial", "Cursive", "Monospace") of every size that is a multiple of 5 and less than 100. e.g. `Font.Arial10`, or `Font.Monospace95`
	 */
	static Serif5: Font;
	/**
	 * These are premade fonts of four common families ("Serif", "Arial", "Cursive", "Monospace") of every size that is a multiple of 5 and less than 100. e.g. `Font.Arial10`, or `Font.Monospace95`
	 */
	static Serif10: Font;
	/**
	 * These are premade fonts of four common families ("Serif", "Arial", "Cursive", "Monospace") of every size that is a multiple of 5 and less than 100. e.g. `Font.Arial10`, or `Font.Monospace95`
	 */
	static Serif15: Font;
	/**
	 * These are premade fonts of four common families ("Serif", "Arial", "Cursive", "Monospace") of every size that is a multiple of 5 and less than 100. e.g. `Font.Arial10`, or `Font.Monospace95`
	 */
	static Serif20: Font;
	/**
	 * These are premade fonts of four common families ("Serif", "Arial", "Cursive", "Monospace") of every size that is a multiple of 5 and less than 100. e.g. `Font.Arial10`, or `Font.Monospace95`
	 */
	static Serif25: Font;
	/**
	 * These are premade fonts of four common families ("Serif", "Arial", "Cursive", "Monospace") of every size that is a multiple of 5 and less than 100. e.g. `Font.Arial10`, or `Font.Monospace95`
	 */
	static Serif30: Font;
	/**
	 * These are premade fonts of four common families ("Serif", "Arial", "Cursive", "Monospace") of every size that is a multiple of 5 and less than 100. e.g. `Font.Arial10`, or `Font.Monospace95`
	 */
	static Serif35: Font;
	/**
	 * These are premade fonts of four common families ("Serif", "Arial", "Cursive", "Monospace") of every size that is a multiple of 5 and less than 100. e.g. `Font.Arial10`, or `Font.Monospace95`
	 */
	static Serif40: Font;
	/**
	 * These are premade fonts of four common families ("Serif", "Arial", "Cursive", "Monospace") of every size that is a multiple of 5 and less than 100. e.g. `Font.Arial10`, or `Font.Monospace95`
	 */
	static Serif45: Font;
	/**
	 * These are premade fonts of four common families ("Serif", "Arial", "Cursive", "Monospace") of every size that is a multiple of 5 and less than 100. e.g. `Font.Arial10`, or `Font.Monospace95`
	 */
	static Serif50: Font;
	/**
	 * These are premade fonts of four common families ("Serif", "Arial", "Cursive", "Monospace") of every size that is a multiple of 5 and less than 100. e.g. `Font.Arial10`, or `Font.Monospace95`
	 */
	static Serif55: Font;
	/**
	 * These are premade fonts of four common families ("Serif", "Arial", "Cursive", "Monospace") of every size that is a multiple of 5 and less than 100. e.g. `Font.Arial10`, or `Font.Monospace95`
	 */
	static Serif60: Font;
	/**
	 * These are premade fonts of four common families ("Serif", "Arial", "Cursive", "Monospace") of every size that is a multiple of 5 and less than 100. e.g. `Font.Arial10`, or `Font.Monospace95`
	 */
	static Serif65: Font;
	/**
	 * These are premade fonts of four common families ("Serif", "Arial", "Cursive", "Monospace") of every size that is a multiple of 5 and less than 100. e.g. `Font.Arial10`, or `Font.Monospace95`
	 */
	static Serif70: Font;
	/**
	 * These are premade fonts of four common families ("Serif", "Arial", "Cursive", "Monospace") of every size that is a multiple of 5 and less than 100. e.g. `Font.Arial10`, or `Font.Monospace95`
	 */
	static Serif75: Font;
	/**
	 * These are premade fonts of four common families ("Serif", "Arial", "Cursive", "Monospace") of every size that is a multiple of 5 and less than 100. e.g. `Font.Arial10`, or `Font.Monospace95`
	 */
	static Serif80: Font;
	/**
	 * These are premade fonts of four common families ("Serif", "Arial", "Cursive", "Monospace") of every size that is a multiple of 5 and less than 100. e.g. `Font.Arial10`, or `Font.Monospace95`
	 */
	static Serif85: Font;
	/**
	 * These are premade fonts of four common families ("Serif", "Arial", "Cursive", "Monospace") of every size that is a multiple of 5 and less than 100. e.g. `Font.Arial10`, or `Font.Monospace95`
	 */
	static Serif90: Font;
	/**
	 * These are premade fonts of four common families ("Serif", "Arial", "Cursive", "Monospace") of every size that is a multiple of 5 and less than 100. e.g. `Font.Arial10`, or `Font.Monospace95`
	 */
	static Serif95: Font;
	/**
	 * These are premade fonts of four common families ("Serif", "Arial", "Cursive", "Monospace") of every size that is a multiple of 5 and less than 100. e.g. `Font.Arial10`, or `Font.Monospace95`
	 */
	static Serif100: Font;
	/**
	 * These are premade fonts of four common families ("Serif", "Arial", "Cursive", "Monospace") of every size that is a multiple of 5 and less than 100. e.g. `Font.Arial10`, or `Font.Monospace95`
	 */
	static Arial5: Font;
	/**
	 * These are premade fonts of four common families ("Serif", "Arial", "Cursive", "Monospace") of every size that is a multiple of 5 and less than 100. e.g. `Font.Arial10`, or `Font.Monospace95`
	 */
	static Arial10: Font;
	/**
	 * These are premade fonts of four common families ("Serif", "Arial", "Cursive", "Monospace") of every size that is a multiple of 5 and less than 100. e.g. `Font.Arial10`, or `Font.Monospace95`
	 */
	static Arial15: Font;
	/**
	 * These are premade fonts of four common families ("Serif", "Arial", "Cursive", "Monospace") of every size that is a multiple of 5 and less than 100. e.g. `Font.Arial10`, or `Font.Monospace95`
	 */
	static Arial20: Font;
	/**
	 * These are premade fonts of four common families ("Serif", "Arial", "Cursive", "Monospace") of every size that is a multiple of 5 and less than 100. e.g. `Font.Arial10`, or `Font.Monospace95`
	 */
	static Arial25: Font;
	/**
	 * These are premade fonts of four common families ("Serif", "Arial", "Cursive", "Monospace") of every size that is a multiple of 5 and less than 100. e.g. `Font.Arial10`, or `Font.Monospace95`
	 */
	static Arial30: Font;
	/**
	 * These are premade fonts of four common families ("Serif", "Arial", "Cursive", "Monospace") of every size that is a multiple of 5 and less than 100. e.g. `Font.Arial10`, or `Font.Monospace95`
	 */
	static Arial35: Font;
	/**
	 * These are premade fonts of four common families ("Serif", "Arial", "Cursive", "Monospace") of every size that is a multiple of 5 and less than 100. e.g. `Font.Arial10`, or `Font.Monospace95`
	 */
	static Arial40: Font;
	/**
	 * These are premade fonts of four common families ("Serif", "Arial", "Cursive", "Monospace") of every size that is a multiple of 5 and less than 100. e.g. `Font.Arial10`, or `Font.Monospace95`
	 */
	static Arial45: Font;
	/**
	 * These are premade fonts of four common families ("Serif", "Arial", "Cursive", "Monospace") of every size that is a multiple of 5 and less than 100. e.g. `Font.Arial10`, or `Font.Monospace95`
	 */
	static Arial50: Font;
	/**
	 * These are premade fonts of four common families ("Serif", "Arial", "Cursive", "Monospace") of every size that is a multiple of 5 and less than 100. e.g. `Font.Arial10`, or `Font.Monospace95`
	 */
	static Arial55: Font;
	/**
	 * These are premade fonts of four common families ("Serif", "Arial", "Cursive", "Monospace") of every size that is a multiple of 5 and less than 100. e.g. `Font.Arial10`, or `Font.Monospace95`
	 */
	static Arial60: Font;
	/**
	 * These are premade fonts of four common families ("Serif", "Arial", "Cursive", "Monospace") of every size that is a multiple of 5 and less than 100. e.g. `Font.Arial10`, or `Font.Monospace95`
	 */
	static Arial65: Font;
	/**
	 * These are premade fonts of four common families ("Serif", "Arial", "Cursive", "Monospace") of every size that is a multiple of 5 and less than 100. e.g. `Font.Arial10`, or `Font.Monospace95`
	 */
	static Arial70: Font;
	/**
	 * These are premade fonts of four common families ("Serif", "Arial", "Cursive", "Monospace") of every size that is a multiple of 5 and less than 100. e.g. `Font.Arial10`, or `Font.Monospace95`
	 */
	static Arial75: Font;
	/**
	 * These are premade fonts of four common families ("Serif", "Arial", "Cursive", "Monospace") of every size that is a multiple of 5 and less than 100. e.g. `Font.Arial10`, or `Font.Monospace95`
	 */
	static Arial80: Font;
	/**
	 * These are premade fonts of four common families ("Serif", "Arial", "Cursive", "Monospace") of every size that is a multiple of 5 and less than 100. e.g. `Font.Arial10`, or `Font.Monospace95`
	 */
	static Arial85: Font;
	/**
	 * These are premade fonts of four common families ("Serif", "Arial", "Cursive", "Monospace") of every size that is a multiple of 5 and less than 100. e.g. `Font.Arial10`, or `Font.Monospace95`
	 */
	static Arial90: Font;
	/**
	 * These are premade fonts of four common families ("Serif", "Arial", "Cursive", "Monospace") of every size that is a multiple of 5 and less than 100. e.g. `Font.Arial10`, or `Font.Monospace95`
	 */
	static Arial95: Font;
	/**
	 * These are premade fonts of four common families ("Serif", "Arial", "Cursive", "Monospace") of every size that is a multiple of 5 and less than 100. e.g. `Font.Arial10`, or `Font.Monospace95`
	 */
	static Arial100: Font;
	/**
	 * These are premade fonts of four common families ("Serif", "Arial", "Cursive", "Monospace") of every size that is a multiple of 5 and less than 100. e.g. `Font.Arial10`, or `Font.Monospace95`
	 */
	static Cursive5: Font;
	/**
	 * These are premade fonts of four common families ("Serif", "Arial", "Cursive", "Monospace") of every size that is a multiple of 5 and less than 100. e.g. `Font.Arial10`, or `Font.Monospace95`
	 */
	static Cursive10: Font;
	/**
	 * These are premade fonts of four common families ("Serif", "Arial", "Cursive", "Monospace") of every size that is a multiple of 5 and less than 100. e.g. `Font.Arial10`, or `Font.Monospace95`
	 */
	static Cursive15: Font;
	/**
	 * These are premade fonts of four common families ("Serif", "Arial", "Cursive", "Monospace") of every size that is a multiple of 5 and less than 100. e.g. `Font.Arial10`, or `Font.Monospace95`
	 */
	static Cursive20: Font;
	/**
	 * These are premade fonts of four common families ("Serif", "Arial", "Cursive", "Monospace") of every size that is a multiple of 5 and less than 100. e.g. `Font.Arial10`, or `Font.Monospace95`
	 */
	static Cursive25: Font;
	/**
	 * These are premade fonts of four common families ("Serif", "Arial", "Cursive", "Monospace") of every size that is a multiple of 5 and less than 100. e.g. `Font.Arial10`, or `Font.Monospace95`
	 */
	static Cursive30: Font;
	/**
	 * These are premade fonts of four common families ("Serif", "Arial", "Cursive", "Monospace") of every size that is a multiple of 5 and less than 100. e.g. `Font.Arial10`, or `Font.Monospace95`
	 */
	static Cursive35: Font;
	/**
	 * These are premade fonts of four common families ("Serif", "Arial", "Cursive", "Monospace") of every size that is a multiple of 5 and less than 100. e.g. `Font.Arial10`, or `Font.Monospace95`
	 */
	static Cursive40: Font;
	/**
	 * These are premade fonts of four common families ("Serif", "Arial", "Cursive", "Monospace") of every size that is a multiple of 5 and less than 100. e.g. `Font.Arial10`, or `Font.Monospace95`
	 */
	static Cursive45: Font;
	/**
	 * These are premade fonts of four common families ("Serif", "Arial", "Cursive", "Monospace") of every size that is a multiple of 5 and less than 100. e.g. `Font.Arial10`, or `Font.Monospace95`
	 */
	static Cursive50: Font;
	/**
	 * These are premade fonts of four common families ("Serif", "Arial", "Cursive", "Monospace") of every size that is a multiple of 5 and less than 100. e.g. `Font.Arial10`, or `Font.Monospace95`
	 */
	static Cursive55: Font;
	/**
	 * These are premade fonts of four common families ("Serif", "Arial", "Cursive", "Monospace") of every size that is a multiple of 5 and less than 100. e.g. `Font.Arial10`, or `Font.Monospace95`
	 */
	static Cursive60: Font;
	/**
	 * These are premade fonts of four common families ("Serif", "Arial", "Cursive", "Monospace") of every size that is a multiple of 5 and less than 100. e.g. `Font.Arial10`, or `Font.Monospace95`
	 */
	static Cursive65: Font;
	/**
	 * These are premade fonts of four common families ("Serif", "Arial", "Cursive", "Monospace") of every size that is a multiple of 5 and less than 100. e.g. `Font.Arial10`, or `Font.Monospace95`
	 */
	static Cursive70: Font;
	/**
	 * These are premade fonts of four common families ("Serif", "Arial", "Cursive", "Monospace") of every size that is a multiple of 5 and less than 100. e.g. `Font.Arial10`, or `Font.Monospace95`
	 */
	static Cursive75: Font;
	/**
	 * These are premade fonts of four common families ("Serif", "Arial", "Cursive", "Monospace") of every size that is a multiple of 5 and less than 100. e.g. `Font.Arial10`, or `Font.Monospace95`
	 */
	static Cursive80: Font;
	/**
	 * These are premade fonts of four common families ("Serif", "Arial", "Cursive", "Monospace") of every size that is a multiple of 5 and less than 100. e.g. `Font.Arial10`, or `Font.Monospace95`
	 */
	static Cursive85: Font;
	/**
	 * These are premade fonts of four common families ("Serif", "Arial", "Cursive", "Monospace") of every size that is a multiple of 5 and less than 100. e.g. `Font.Arial10`, or `Font.Monospace95`
	 */
	static Cursive90: Font;
	/**
	 * These are premade fonts of four common families ("Serif", "Arial", "Cursive", "Monospace") of every size that is a multiple of 5 and less than 100. e.g. `Font.Arial10`, or `Font.Monospace95`
	 */
	static Cursive95: Font;
	/**
	 * These are premade fonts of four common families ("Serif", "Arial", "Cursive", "Monospace") of every size that is a multiple of 5 and less than 100. e.g. `Font.Arial10`, or `Font.Monospace95`
	 */
	static Cursive100: Font;
	/**
	 * These are premade fonts of four common families ("Serif", "Arial", "Cursive", "Monospace") of every size that is a multiple of 5 and less than 100. e.g. `Font.Arial10`, or `Font.Monospace95`
	 */
	static Monospace5: Font;
	/**
	 * These are premade fonts of four common families ("Serif", "Arial", "Cursive", "Monospace") of every size that is a multiple of 5 and less than 100. e.g. `Font.Arial10`, or `Font.Monospace95`
	 */
	static Monospace10: Font;
	/**
	 * These are premade fonts of four common families ("Serif", "Arial", "Cursive", "Monospace") of every size that is a multiple of 5 and less than 100. e.g. `Font.Arial10`, or `Font.Monospace95`
	 */
	static Monospace15: Font;
	/**
	 * These are premade fonts of four common families ("Serif", "Arial", "Cursive", "Monospace") of every size that is a multiple of 5 and less than 100. e.g. `Font.Arial10`, or `Font.Monospace95`
	 */
	static Monospace20: Font;
	/**
	 * These are premade fonts of four common families ("Serif", "Arial", "Cursive", "Monospace") of every size that is a multiple of 5 and less than 100. e.g. `Font.Arial10`, or `Font.Monospace95`
	 */
	static Monospace25: Font;
	/**
	 * These are premade fonts of four common families ("Serif", "Arial", "Cursive", "Monospace") of every size that is a multiple of 5 and less than 100. e.g. `Font.Arial10`, or `Font.Monospace95`
	 */
	static Monospace30: Font;
	/**
	 * These are premade fonts of four common families ("Serif", "Arial", "Cursive", "Monospace") of every size that is a multiple of 5 and less than 100. e.g. `Font.Arial10`, or `Font.Monospace95`
	 */
	static Monospace35: Font;
	/**
	 * These are premade fonts of four common families ("Serif", "Arial", "Cursive", "Monospace") of every size that is a multiple of 5 and less than 100. e.g. `Font.Arial10`, or `Font.Monospace95`
	 */
	static Monospace40: Font;
	/**
	 * These are premade fonts of four common families ("Serif", "Arial", "Cursive", "Monospace") of every size that is a multiple of 5 and less than 100. e.g. `Font.Arial10`, or `Font.Monospace95`
	 */
	static Monospace45: Font;
	/**
	 * These are premade fonts of four common families ("Serif", "Arial", "Cursive", "Monospace") of every size that is a multiple of 5 and less than 100. e.g. `Font.Arial10`, or `Font.Monospace95`
	 */
	static Monospace50: Font;
	/**
	 * These are premade fonts of four common families ("Serif", "Arial", "Cursive", "Monospace") of every size that is a multiple of 5 and less than 100. e.g. `Font.Arial10`, or `Font.Monospace95`
	 */
	static Monospace55: Font;
	/**
	 * These are premade fonts of four common families ("Serif", "Arial", "Cursive", "Monospace") of every size that is a multiple of 5 and less than 100. e.g. `Font.Arial10`, or `Font.Monospace95`
	 */
	static Monospace60: Font;
	/**
	 * These are premade fonts of four common families ("Serif", "Arial", "Cursive", "Monospace") of every size that is a multiple of 5 and less than 100. e.g. `Font.Arial10`, or `Font.Monospace95`
	 */
	static Monospace65: Font;
	/**
	 * These are premade fonts of four common families ("Serif", "Arial", "Cursive", "Monospace") of every size that is a multiple of 5 and less than 100. e.g. `Font.Arial10`, or `Font.Monospace95`
	 */
	static Monospace70: Font;
	/**
	 * These are premade fonts of four common families ("Serif", "Arial", "Cursive", "Monospace") of every size that is a multiple of 5 and less than 100. e.g. `Font.Arial10`, or `Font.Monospace95`
	 */
	static Monospace75: Font;
	/**
	 * These are premade fonts of four common families ("Serif", "Arial", "Cursive", "Monospace") of every size that is a multiple of 5 and less than 100. e.g. `Font.Arial10`, or `Font.Monospace95`
	 */
	static Monospace80: Font;
	/**
	 * These are premade fonts of four common families ("Serif", "Arial", "Cursive", "Monospace") of every size that is a multiple of 5 and less than 100. e.g. `Font.Arial10`, or `Font.Monospace95`
	 */
	static Monospace85: Font;
	/**
	 * These are premade fonts of four common families ("Serif", "Arial", "Cursive", "Monospace") of every size that is a multiple of 5 and less than 100. e.g. `Font.Arial10`, or `Font.Monospace95`
	 */
	static Monospace90: Font;
	/**
	 * These are premade fonts of four common families ("Serif", "Arial", "Cursive", "Monospace") of every size that is a multiple of 5 and less than 100. e.g. `Font.Arial10`, or `Font.Monospace95`
	 */
	static Monospace95: Font;
	/**
	 * These are premade fonts of four common families ("Serif", "Arial", "Cursive", "Monospace") of every size that is a multiple of 5 and less than 100. e.g. `Font.Arial10`, or `Font.Monospace95`
	 */
	static Monospace100: Font;
	/**
	 * Creates a new font.
	 * @param size - The size of the font
	 * @param family - The font family
	 * @param bold - Whether the font is bold, default is false
	 * @param italic - Whether the font is italic, default is false
	 */
	constructor(size: number, family: string, bold?: boolean, italic?: boolean);
	/**
	 * Packs a string of text into a fixed width, adding new lines as necessary to prevent overflow.
	 * @param text - The text to pack
	 * @param maxWidth - The maximum allowed width of a single line in the output text
	 */
	packText(text: string, maxWidth: number): string;
	/**
	 * Returns the width and height of a string of text, optionally after being packed into a fixed max width.
	 * The return value contains `.width` and `.height` properties, both of which are Numbers.
	 * @param text - The text to be measured
	 * @param maxWidth - The maximum allowed width of a single line before wrapping occurs. Default is Infinity
	 */
	getTextBounds(text: string, maxWidth?: number): { width: number, height: number };
	/**
	 * Returns the width of a string of text.
	 * @param text - The text to measure
	 */
	getTextWidth(text: string): number;
	/**
	 * Returns the height of a string of text.
	 * @param text - The text to measure
	 * @param packWidth - The maximum allowed width of a single line before wrapping occurs. Default is Infinity
	 */
	getTextHeight(text: string, packWidth?: number): number;
	/**
	 * Converts the Font to a valid CSS font string.
	 */
	toString(): string;
	/**
	 * Creates a copy of the object and optionally stores it in a provided destination.
	 * @param destination - The destination to copy the object into. This must be the same type as the caller
	 */
	get(destination?: this): this;
}

/**
 * Represents an image that can be rendered.
 * This is an abstract superclass and should not be constructed.
 */
declare class ImageType {
	/**
	 * The natural rendered width of the image
	 */
	width: number;
	/**
	 * The natural rendered height of the image
	 */
	height: number;
	/**
	 * Whether the contents of the image can change over time
	 */
	static dynamic: boolean;
	/**
	 * Returns the pixel density of the image, measured as the ratio of the number of pixels in a row of the image to the natural width of the image.
	 */
	get pixelRatio(): number;
	/**
	 * Returns the width of the image in actual pixels, accounting for the pixel density of the image.
	 */
	get pixelWidth(): number;
	/**
	 * Returns the height of the image in actual pixels, accounting for the pixel density of the image.
	 */
	get pixelHeight(): number;
	/**
	 * Simultaneously updates the width and height of the image.
	 * Updates that occur on image resizing will only happen once with a call to this method, which can improve performance as opposed to simply assigning to `.width` and `.height` in a row.
	 * @param width - The new natural width of the image
	 * @param height - The new natural height of the image
	 */
	resize(width: number, height: number): void;
	/**
	 * Checks whether a given point is inside the natural bounds of the image with the upper-left corner at the origin.
	 * This operation is inclusive on the lower bound and exclusive on the upper bound.
	 * @param point - The point to check
	 */
	contains(point: Vector2): boolean;
	/**
	 * Checks whether a given point is inside the natural bounds of the image with the upper-left corner at the origin.
	 * This operation is inclusive on the lower bound and exclusive on the upper bound.
	 * @param x - The x coordinate of the point to check
	 * @param y - The y coordinate of the point to check
	 */
	contains(x: number, y: number): boolean;
	/**
	 * Returns the width of the image required for a given height to maintain the aspect ratio.
	 * @param height - The potential height of the image
	 */
	inferWidth(height: number): number;
	/**
	 * Returns the height of the image required for a given width to maintain the aspect ratio.
	 * @param width - The potential width of the image
	 */
	inferHeight(width: number): number;
	/**
	 * Converts the content of the image to a data: url.
	 */
	toDataURL(): string;
	/**
	 * Downloads the image as a PNG, with a specified name.
	 * Returns a promise that resolves when the image downloads.
	 * @param name - The name of the downloaded image, without the extension
	 */
	download(name: string): Promise;
}

/**
 * Represents an externally loaded image file.
 * These should be loaded using HengineImageResource and not constructed directly.
 * ```js
 * const catImage = loadResource("cat.png"); // load the HImage
 * 
 * renderer.image(catImage).rect(0, 0, 100, 100);
 * ```
 */
declare class HImage extends ImageType {
	/**
	 * Checks whether an image exists at a specified file path.
	 * Returns a promise that resolves to whether the image exists.
	 * @param src - The file path to check
	 */
	static imageExists(src: string): Promise<boolean>;
}

/**
 * Represents an offscreen drawing surface that can be rendered as an image.
 * It is based on the HTML5 Canvas API.
 * ```js
 * const frame = new Frame(100, 200);
 * 
 * // add shapes to the frame
 * frame.renderer.stroke(new Color("blue"), 2).rect(10, 10, 20, 20);
 * frame.renderer.draw(new Color("red")).circle(30, 100, 50);
 * 
 * // render the frame to the screen
 * renderer.image(frame).default(0, 0);
 * ```
 */
declare class Frame extends ImageType implements Copyable {
	/**
	 * The renderer local to the frame that can be used to modify its contents. This property is read-only
	 */
	renderer: CanvasArtist2D;
	/**
	 * Creates a new Frame.
	 * @param width - The natural width of the frame
	 * @param height - The natural height of the frame
	 * @param pixelRatio - The pixel ratio for the frame. The default is `window.devicePixelRatio`
	 */
	constructor(width: number, height: number, pixelRatio?: number);
	/**
	 * Returns a copy of the frame stretched to a new set of dimensions.
	 * @param width - The width of the stretched image
	 * @param height - The height of the stretched image
	 */
	stretch(width: number, height: number): this;
	/**
	 * Returns a frame containing a rectangular region of the caller. 
	 * @param region - The region to extract
	 */
	clip(region: Rect): this;
	/**
	 * Returns a frame containing a rectangular region of the caller. 
	 * @param x - The x coordinate of the upper-left corner of the region.
	 * @param y - The y coordinate of the upper-left corner of the region.
	 * @param width - The width of the region
	 * @param height - The height of the region
	 */
	clip(x: number, y: number, width: number, height: number): this;
	/**
	 * Returns a frame containing the (optionally clipped) contents of an image.
	 * If no clipping parameters are provided, the whole image will be copied.
	 * The copy will have the same pixel ratio as the original image.
	 * @param image - The image to copy data from
	 */
	static fromImageType(image: ImageType): Frame;
	/**
	 * Returns a frame containing the (optionally clipped) contents of an image.
	 * If no clipping parameters are provided, the whole image will be copied.
	 * The copy will have the same pixel ratio as the original image.
	 * @param image - The image to copy data from
	 * @param region - The region to extract
	 */
	static fromImageType(image: ImageType, region: Rect): Frame;
	/**
	 * Returns a frame containing the (optionally clipped) contents of an image.
	 * If no clipping parameters are provided, the whole image will be copied.
	 * The copy will have the same pixel ratio as the original image.
	 * @param image - The image to copy data from
	 * @param x - The x coordinate of the upper-left corner of the region.
	 * @param y - The y coordinate of the upper-left corner of the region.
	 * @param width - The width of the region
	 * @param height - The height of the region
	 */
	static fromImageType(image: ImageType, x: number, y: number, width: number, height: number): Frame;
	/**
	 * Creates a copy of the object and optionally stores it in a provided destination.
	 * @param destination - The destination to copy the object into. This must be the same type as the caller
	 */
	get(destination?: this): this;
}

/**
 * Represents the renderable result of a GLSL fragment shader invoked for every pixel in a rectangular region.
 * The entry point for the shader is a function of the form:
 * ```glsl
 * vec4 shader() { ... }
 * ```
 * Several engine-provided uniforms are given, specifically:
 * ```glsl
 * uniform vec2 position; // the pixel-space coordinates of the pixel, with (0, 0) in the top-left corner
 * uniform vec2 resolution; // the width and height of the image, in pixels
 * ```
 * ```js
 * // grayscale shader
 * const shader = new GPUShader(300, 300, `
 * 	uniform sampler2D image;
 * 
 * 	vec4 shader() {
 * 		vec2 uv = position / resolution;
 * 		vec3 color = texture(image, uv);
 * 		float brightness = (color.r + color.g + color.b) / 3.0;
 * 		return vec4(vec3(brightness), 1.0);
 * 	}
 * `);
 * 
 * const cat = loadResource("cat.png");
 * 
 * shader.setUniform("image", cat); // put image in shader
 * 
 * renderer.image(shader).default(0, 0); // draw grayscale cat
 * ```
 */
declare class GPUShader extends ImageType implements GPUInterface {
	/**
	 * Creates a new GPUShader.
	 * @param width - The width of the rectangle on which the shader is invoked
	 * @param height - The height of the rectangle on which the shader is invoked
	 * @param glsl - The GLSL source code of the shader
	 * @param pixelRatio - The pixel ratio of the shader. Higher values will result in more shader invocations. Default is 1
	 */
	constructor(width: number, height: number, glsl: string, pixelRatio?: number);
	/**
	 * The source code of the program
	 */
	glsl: string;
	/**
	 * Sets the value of a uniform in the program.
	 * @param name - The name of the uniform
	 * @param value - The new value for the uniform. For the type of this argument, see the GLSL API
	 */
	setUniform(name: string, value: any): void;
	/**
	 * Sets the value of many uniforms at once.
	 * @param uniforms - A set of key-value pairs, where the key represents the uniform name, and the value represents the uniform value
	 */
	setUniforms(uniforms: object): void;
	/**
	 * Retrieves the current value of a given uniform.
	 * For the return type of this function, see the GLSL API.
	 * @param name - The name of the uniform
	 */
	getUniform(name: string): any;
	/**
	 * Checks whether a given uniform exists.
	 * @param name - The name of the uniform to check
	 */
	argumentExists(name: string): boolean;
}

/**
 * This is an interface for values passed to methods of Gradient.
 * Represents a point along a gradient with a specific value.
 */
declare interface ValueStop {
	/**
	 * The parameter value at which this stop's value reaches full intensity
	 */
	start: number;
	/**
	 * The gradient value at this stop
	 */
	value: Operable;
}

/**
 * Represents a parameterized gradient between a series of different values.
 * These values can be of any Operable type.
 * ```js
 * // color of daylight at different times
 * const daylightGradient = new Gradient([
 * 	{ start: 0, value: new Color("black") },
 * 	{ start: 7, value: new Color("purple") },
 * 	{ start: 8, value: new Color("orange") },
 * 	{ start: 12, value: new Color("yellow") },
 * 	{ start: 20, value: new Color("red") },
 * 	{ start: 24, value: new Color("black") }
 * ]);
 * 
 * intervals.continuous(() => {
 * 	const hourMS = 1000 * 60 * 60;
 * 	const hour = (Date.now() % (hourMS * 24)) / hourMS;
 * 	const color = daylightGradient.sample(hour);
 * 	renderer.fill(color);
 * });
 * ```
 */
declare class Gradient {
	/**
	 * Creates a new Gradient.
	 * @param valueStops - A list of specified values at specified points.
	 */
	constructor(valueStops: ValueStop[]);
	/**
	 * Adds an additional value stop.
	 * @param valueStop - The value stop to add.
	 */
	addValueStop(valueStop: ValueStop): void;
	/**
	 * Samples the gradient at a specific value of the parameter
	 * @param t - The parameter value to sample at
	 */
	sample(t: number): Operable;
}

/**
 * Represents a single variable that can be graphed on a GraphPlane.
 */
declare class Graph {
	/**
	 * The displayed name of the variable
	 */
	name: string;
	/**
	 * A function which returns the current value of the variable
	 */
	y: () => number;
	/**
	 * The minimum displayed value of the variable. This is the lower bound of the vertical axis
	 */
	minY: number;
	/**
	 * The maximum displayed value of the variable. This is the upper bound of the vertical axis
	 */
	maxY: number;
	/**
	 * The color of the graph of this variable
	 */
	color: Color;
	/**
	 * The number of decimal places to display for the value of this variable
	 */
	decimalPlaces: number;
	/**
	 * The plane on which this graph is displayed
	 */
	plane: GraphPlane;
	/**
	 * Creates a new Graph.
	 * @param name - The displayed name of the variable
	 * @param y - A function which returns the current value of the variable
	 * @param minY - The minimum displayed value of the variable
	 * @param maxY - The maximum displayed value of the variable
	 * @param color - The color of the graph of this variable
	 * @param decimalPlaces - The number of decimal places to display for the value of this variable. Default is 2
	 */
	constructor(name: string, y: () => number, minY: number, maxY: number, color: Color, decimalPlaces?: number);
}

/**
 * Represents a renderable, updating graph of one or more variables.
 * This class is to be used for debugging or technical visualization purposes, rather than in games or tools.
 * This class should not be constructed and should instead be created using `IntervalManager.prototype.makeGraphPlane()`.
 * ```js
 * // graph the value of perlin noise
 * const graph = intervals.makeGraphPlane([
 * 	new Graph("Perlin", () => {
 * 		const time = intervals.frameCount;
 * 		return Random.perlin(time, 0.01);
 * 	}, 0, 1, new Color("white"))
 * ]);
 * 
 * intervals.continuous(() => {
 * 	renderer.image(graph).default(10, 10);
 * });
 * ```
 */
declare class GraphPlane extends Frame {
	/**
	 * The graphs displayed on this plane
	 */
	graphs: Graph[];
	/**
	 * The total number of frames displayed on the graph plane
	 */
	frameLimit: number;
}

/**
 * Represents a 2D grid of grayscale values.
 * ```js
 * const perlinMap = new GrayMap(100, 100, (x, y) => {
 * 	return Random.perlin2D(x, y, 0.1);
 * });
 * ```
 */
declare class GrayMap implements Serializable {
	/**
	 * The width of the map
	 */
	width: number;
	/**
	 * The height of the map
	 */
	height: number;
	/**
	 * The intensity values (on [0, 1]) of the map
	 */
	data: number[][];
	/**
	 * Creates a new GrayMap based on an intensity function.
	 * @param width - The width of the map
	 * @param height - The height of the map
	 * @param rule - A function to be called for each coordinate pair to generate the intensity values
	 */
	constructor(width: number, height: number, rule: (arg0: number, arg1: number) => number);
	/**
	 * Returns the grayscale value at a specified point, or -1 if the point is out of bounds.
	 * @param x - The x coordinate of the sample point
	 * @param y - The y coordinate of the sample point
	 */
	get(x: number, y: number): number;
	/**
	 * Writes the object to a buffer and returns it.
	 * @param buffer - A destination buffer to write the result to. If not specified, a new buffer will be created
	 */
	toByteBuffer(buffer?: ByteBuffer): ByteBuffer;
	/**
	 * Creates an instance of the class based on data read from the current pointed-to location in a buffer. This increments the buffer's pointer to after the data of the instance.
	 * @param buffer - A source buffer to read the data from
	 */
	static fromByteBuffer(buffer: ByteBuffer): Serializable;
}

/**
 * Represents a renderer for a graphical surface.
 * This is an abstract superclass and should not be constructed.
 */
declare class Artist {
	/**
	 * Clears the rendering surface to transparent black.
	 */
	clear(): void;
	/**
	 * Assuming that the current transform is the identity transformation, this fills the surface with a single color. If the color is transparent, it will simply layer on top of the current content.
	 * @param color - The color to fill with
	 */
	fill(color: Color): void;
	/**
	 * Manipulates the current coordinate transform. For an Artist `a` and Matrix `m`, `a.addTransform(m)` is equivalent to `a.transform = m.times(a.transform)`.
	 * @param transform - The coordinate transform to compose with the existing transform
	 */
	addTransform(transform: Matrix): void;
	/**
	 * Calls a function while using a specified coordinate transform
	 * @param transform - The specific coordinate transform to use
	 * @param draw - The function that will be called while using the specified transform
	 * @param global - Whether the transform should be applied in place of all current transforms (true), or composed with the current transform (false). Default is true.
	 */
	drawThrough(transform: Matrix, draw: () => void, global?: boolean): void;
	/**
	 * Returns the renderer to the identity coordinate transform.
	 */
	clearTransformations(): void;
	/**
	 * Sets the current coordinate transform of the renderer.
	 * @param transform - The new transform
	 */
	set transform(transform: Matrix);
	/**
	 * Returns the current coordinate transform of the renderer.
	 */
	get transform(): Matrix;
	/**
	 * Pushes the current rendering state onto the state stack.
	 * This state includes `.transform`.
	 */
	save(): void;
	/**
	 * Puts the renderer into the state on top of the state stack, then removes it from the stack.
	 */
	restore(): void;
	/**
	 * Composites an image onto the entire surface of the renderer.
	 * @param overlay - The image to overlay onto the surface
	 */
	overlay(overlay: ImageType): void;
}

/**
 * Represents a 2D renderer for a graphical surface.
 * All transformation-related matrices for this renderer are of type Matrix3.
 * This is an abstract superclass and should not be constructed.
 * ```js
 * renderer.draw(new Color("blue")).shape(Polygon.regular(5, 100).move(middle));
 * renderer.stroke(new Color("red"), 20, LineCap.SQUARE, LineJoin.ROUND).connector([
 * 	new Vector2(0, 0),
 * 	new Vector2(50, 100),
 * 	new Vector2(150, 200),
 * 	new Vector2(300, 100)
 * ]);
 *   
 * renderer.clip().circle(0, 0, 100);
 * renderer.draw(new Color("lime")).rect(0, 0, 80, 80);
 * renderer.unclip();
 * ```
 */
declare class Artist2D extends Artist {
	/**
	 * The surface on which the renderer renders. This property is read-only
	 */
	imageType: ImageType;
	/**
	 * The current text-alignment mode. Starts as `TextMode.TOP_LEFT`
	 */
	textMode: TextMode;
	/**
	 * The current color-blending mode. Starts as `BlendMode.COMBINE`
	 */
	blendMode: BlendMode;
	/**
	 * The current global alpha. This will multiply the alpha of all other drawing calls. This is included in the save state of `.save()` and `.restore()`. Starts as 1
	 */
	alpha: number;
	/**
	 * Whether or not image smoothing will be prevented when upscaling. Starts as true
	 */
	preservePixelart: boolean;
	/**
	 * Returns a drawing API that uses a specified color.
	 * @param color - The fill color
	 */
	draw(color: Color): DrawRenderer;
	/**
	 * Returns a stroke API that uses specific settings.
	 * @param color - The outline color
	 * @param lineWidth - The width of the outline in pixels. Default is 1
	 * @param lineCap - The line cap to use. Default is `LineCap.FLAT`
	 * @param lineJoin - The line join to use for connected segments. Default is `LineJoin.BEVEL`
	 */
	stroke(color: Color, lineWidth?: number, lineCap?: LineCap, lineJoin?: LineJoin): StrokeRenderer;
	/**
	 * Returns an image rendering API that uses a specified image.
	 * @param image - The image to render
	 */
	image(image: ImageType): ImageRenderer;
	/**
	 * In a transform with no translation, rotation, or scaling, this flips the x axis about the middle of the screen.
	 */
	invertX(): void;
	/**
	 * In a transform with no translation rotation, or scaling, this flips the y axis about the middle of the screen.
	 */
	invertY(): void;
	/**
	 * Changes the coordinate transform by displacing it.
	 * @param displacement - The displacement
	 */
	translate(displacement: Vector2): void;
	/**
	 * Changes the coordinate transform by displacing it.
	 * @param x - The displacement along the x axis
	 * @param y - The displacement along the y axis
	 */
	translate(x: number, y: number): void;
	/**
	 * Changes the coordinate transform by scaling it.
	 * @param factors - The scaling factors for both axes
	 */
	scale(factors: Vector2): void;
	/**
	 * Changes the coordinate transform by scaling it.
	 * @param x - The scaling along the x axis
	 * @param y - The scaling along the y axis.
	 */
	scale(x: number, y: number): void;
	/**
	 * Changes the coordinate transform by scaling it.
	 * @param factor - The scaling factor for both axes
	 */
	scale(factor: number): void;
	/**
	 * Changes the coordinate transform by rotating it clockwise by a specified angle.
	 * @param angle - The amount to rotate by, in radians
	 */
	rotate(angle: number): void;
	/**
	 * Changes the coordinate transform by rotating it clockwise about a specified point.
	 * @param point - The point to rotate about
	 * @param angle - The angle to rotate by
	 */
	rotateAround(point: Vector2, angle: number): void;
	/**
	 * Changes the coordinate transform by rotating it clockwise about a specified point.
	 * @param x - The x coordinate to rotate about
	 * @param y - The y coordinate to rotate about
	 * @param angle - The angle to rotate by
	 */
	rotateAround(x: number, y: number, angle: number): void;
}

/**
 * Specifies where on a string of text should be considered its origin.
 */
declare enum TextMode {
	/**
	 * Specifies that text should be aligned vertically based on VERTICAL (`TOP`, `CENTER`, or `BOTTOM`), and should be aligned horizontally based on HORIZONTAL (`LEFT`, `CENTER`, `RIGHT`)
	 */
	TOP_LEFT,
	/**
	 * Specifies that text should be aligned vertically based on VERTICAL (`TOP`, `CENTER`, or `BOTTOM`), and should be aligned horizontally based on HORIZONTAL (`LEFT`, `CENTER`, `RIGHT`)
	 */
	CENTER_LEFT,
	/**
	 * Specifies that text should be aligned vertically based on VERTICAL (`TOP`, `CENTER`, or `BOTTOM`), and should be aligned horizontally based on HORIZONTAL (`LEFT`, `CENTER`, `RIGHT`)
	 */
	BOTTOM_LEFT,
	/**
	 * Specifies that text should be aligned vertically based on VERTICAL (`TOP`, `CENTER`, or `BOTTOM`), and should be aligned horizontally based on HORIZONTAL (`LEFT`, `CENTER`, `RIGHT`)
	 */
	TOP_CENTER,
	/**
	 * Specifies that text should be aligned vertically based on VERTICAL (`TOP`, `CENTER`, or `BOTTOM`), and should be aligned horizontally based on HORIZONTAL (`LEFT`, `CENTER`, `RIGHT`)
	 */
	CENTER_CENTER,
	/**
	 * Specifies that text should be aligned vertically based on VERTICAL (`TOP`, `CENTER`, or `BOTTOM`), and should be aligned horizontally based on HORIZONTAL (`LEFT`, `CENTER`, `RIGHT`)
	 */
	BOTTOM_CENTER,
	/**
	 * Specifies that text should be aligned vertically based on VERTICAL (`TOP`, `CENTER`, or `BOTTOM`), and should be aligned horizontally based on HORIZONTAL (`LEFT`, `CENTER`, `RIGHT`)
	 */
	TOP_RIGHT,
	/**
	 * Specifies that text should be aligned vertically based on VERTICAL (`TOP`, `CENTER`, or `BOTTOM`), and should be aligned horizontally based on HORIZONTAL (`LEFT`, `CENTER`, `RIGHT`)
	 */
	CENTER_RIGHT,
	/**
	 * Specifies that text should be aligned vertically based on VERTICAL (`TOP`, `CENTER`, or `BOTTOM`), and should be aligned horizontally based on HORIZONTAL (`LEFT`, `CENTER`, `RIGHT`)
	 */
	BOTTOM_RIGHT
}

/**
 * Represents the way in which colors being added to a surface should interact with those already there.
 */
declare enum BlendMode {
	/**
	 * New colors should be component-wise added to the existing colors
	 */
	ADD,
	/**
	 * New colors should be blended with old colors based on opacity
	 */
	COMBINE,
	/**
	 * New colors are drawn behind old colors, as if new pixels were rendered first and then combined via `BlendMode.COMBINE`
	 */
	BEHIND
}

/**
 * Represents the way in which consecutive line segments should connect.
 */
declare enum LineJoin {
	/**
	 * The edges of the lines will be extended until they meet
	 */
	MITER,
	/**
	 * The edges of the lines will be connected straight across
	 */
	BEVEL,
	/**
	 * The gap between the lines will be filled with an arc
	 */
	ROUND
}

/**
 * Represents the way the ends of line segments will be displayed.
 */
declare enum LineCap {
	/**
	 * The lines will have square ends that extend just to the end of the line
	 */
	FLAT,
	/**
	 * The lines will have square ends that extend half their side length past the end of the line
	 */
	SQUARE,
	/**
	 * The lines will end with half-circles
	 */
	ROUND
}

/**
 * Represents a 2D renderer based on the HTML5 Canvas API.
 */
declare class CanvasArtist2D extends Artist2D {
	/**
	 * Returns the color of a specific pixel in natural-space.
	 * @param x - The x coordinate of the pixel
	 * @param y - The y coordinate of the pixel
	 */
	getPixel(x: number, y: number): Color;
	/**
	 * Sets the color of a specific pixel in natural-space.
	 * @param x - The x coordinate of the pixel
	 * @param y - The y coordinate of the pixel
	 * @param color - The new color for the pixel
	 */
	setPixel(x: number, y: number, color: Color): void;
	/**
	 * Returns a clipping API.
	 */
	clip(): ClipRenderer;
	/**
	 * Undoes the last clipping operation performed in the current state stack.
	 */
	unclip(): void;
	/**
	 * Clears a rectangular region of the surface to transparent black.
	 * @param region - The region to clear
	 */
	clearRect(region: Rect): void;
	/**
	 * Clears a rectangular region of the surface to transparent black.
	 * @param x - The x coordinate of the region to clear
	 * @param y - The y coordinate of the region to clear
	 * @param width - The width of the region to clear
	 * @param height - The height of the region to clear
	 */
	clearRect(x: number, y: number, width: number, height: number): void;
}

/**
 * Represents a generic drawing API of an Artist2D.
 * The exact operation used to render the paths is specified in subclasses, but this class which shapes are possible and how they are specified.
 * This is an abstract superclass and should not be constructed.
 */
declare class PathRenderer {
	/**
	 * Creates a rectangular path.
	 * @param rectangle - The shape of the rectangle
	 */
	rect(rectangle: Rect): void;
	/**
	 * Creates a rectangular path.
	 * @param x - The x coordinate of the rectangle's upper-left corner
	 * @param y - The y coordinate of the rectangle's upper-left corner
	 * @param width - The width of the rectangle
	 * @param height - The height of the rectangle
	 */
	rect(x: number, y: number, width: number, height: number): void;
	/**
	 * Creates a rectangular path with rounded corners.
	 * @param rectangle - The shape of the rectangle
	 * @param topLeft - The radius of the top-left corner
	 * @param topRight - The radius of the top-right corner. Defaults to be the same as the top-left
	 * @param bottomRight - The radius of the bottom-right corner. Defaults to be the same as the top-left
	 * @param bottomLeft - The radius of the bottom-left corner. Defaults to be the same as the top-left
	 */
	roundRect(rectangle: Rect, topLeft: number, topRight?: number, bottomRight?: number, bottomLeft?: number): void;
	/**
	 * Creates a rectangular path with rounded corners.
	 * @param x - The x coordinate of the rectangle's upper-left corner
	 * @param y - The y coordinate of the rectangle's upper-left corner
	 * @param width - The width of the rectangle
	 * @param height - The height of the rectangle
	 * @param topLeft - The radius of the top-left corner
	 * @param topRight - The radius of the top-right corner. Defaults to be the same as the top-left
	 * @param bottomRight - The radius of the bottom-right corner. Defaults to be the same as the top-left
	 * @param bottomLeft - The radius of the bottom-left corner. Defaults to be the same as the top-left
	 */
	roundRect(x: number, y: number, width: number, height: number, topLeft: number, topRight?: number, bottomRight?: number, bottomLeft?: number): void;
	/**
	 * Creates a triangular path.
	 * @param triangle - The shape of the path
	 */
	triangle(triangle: Polygon): void;
	/**
	 * Creates a triangular path.
	 * @param a - The first point of the triangle
	 * @param b - The second point of the triangle
	 * @param c - The last point of the triangle
	 */
	triangle(a: Vector2, b: Vector2, c: Vector2): void;
	/**
	 * Creates a polygonal path.
	 * @param vertices - The vertices of the polygon
	 */
	shape(vertices: Vector2[]): void;
	/**
	 * Creates a polygonal path.
	 * @param polygon - The shape of the polygon
	 */
	shape(polygon: Polygon): void;
	/**
	 * Creates a path in the shape of a section (sector or arc) of a circle. If an arc is filled, it will first have the endpoints connected.
	 * @param circle - The circle of which the path is a section
	 * @param begin - The initial clockwise angle (in radians) from the horizontal of the section
	 * @param end - The final clockwise angle (in radians) from the horizontal of the section
	 * @param counterClockwise - Whether the path from the initial to final angle should be counter-clockwise. Default is false
	 */
	sector(circle: Circle, begin: number, end: number, counterClockwise?: boolean): void;
	/**
	 * Creates a path in the shape of a section (sector or arc) of a circle. If an arc is filled, it will first have the endpoints connected.
	 * @param center - The center of the circle
	 * @param radius - The radius of the circle
	 * @param begin - The initial clockwise angle (in radians) from the horizontal of the section
	 * @param end - The final clockwise angle (in radians) from the horizontal of the section
	 * @param counterClockwise - Whether the path from the initial to final angle should be counter-clockwise. Default is false
	 */
	sector(center: Vector2, radius: number, begin: number, end: number, counterClockwise?: boolean): void;
	/**
	 * Creates a path in the shape of a section (sector or arc) of a circle. If an arc is filled, it will first have the endpoints connected.
	 * @param x - The x coordinate of the circle's center
	 * @param y - The y coordinate of the circle's center
	 * @param radius - The radius of the circle
	 * @param begin - The initial clockwise angle (in radians) from the horizontal of the section
	 * @param end - The final clockwise angle (in radians) from the horizontal of the section
	 * @param counterClockwise - Whether the path from the initial to final angle should be counter-clockwise. Default is false
	 */
	sector(x: number, y: number, radius: number, begin: number, end: number, counterClockwise?: boolean): void;
	/**
	 * Creates a path in the shape of a section (sector or arc) of a circle. If an arc is filled, it will first have the endpoints connected.
	 * @param circle - The circle of which the path is a section
	 * @param begin - The initial clockwise angle (in radians) from the horizontal of the section
	 * @param end - The final clockwise angle (in radians) from the horizontal of the section
	 * @param counterClockwise - Whether the path from the initial to final angle should be counter-clockwise. Default is false
	 */
	arc(circle: Circle, begin: number, end: number, counterClockwise?: boolean): void;
	/**
	 * Creates a path in the shape of a section (sector or arc) of a circle. If an arc is filled, it will first have the endpoints connected.
	 * @param center - The center of the circle
	 * @param radius - The radius of the circle
	 * @param begin - The initial clockwise angle (in radians) from the horizontal of the section
	 * @param end - The final clockwise angle (in radians) from the horizontal of the section
	 * @param counterClockwise - Whether the path from the initial to final angle should be counter-clockwise. Default is false
	 */
	arc(center: Vector2, radius: number, begin: number, end: number, counterClockwise?: boolean): void;
	/**
	 * Creates a path in the shape of a section (sector or arc) of a circle. If an arc is filled, it will first have the endpoints connected.
	 * @param x - The x coordinate of the circle's center
	 * @param y - The y coordinate of the circle's center
	 * @param radius - The radius of the circle
	 * @param begin - The initial clockwise angle (in radians) from the horizontal of the section
	 * @param end - The final clockwise angle (in radians) from the horizontal of the section
	 * @param counterClockwise - Whether the path from the initial to final angle should be counter-clockwise. Default is false
	 */
	arc(x: number, y: number, radius: number, begin: number, end: number, counterClockwise?: boolean): void;
	/**
	 * Creates an elliptical path.
	 * @param center - The center of the ellipse
	 * @param radiusX - The x axis radius of the ellipse
	 * @param radiusY - The y axis radius of the ellipse
	 */
	ellipse(center: Vector2, radiusX: number, radiusY: number): void;
	/**
	 * Creates an elliptical path.
	 * @param x - The x coordinate of the ellipse's center
	 * @param y - The y coordinate of the ellipse's center
	 * @param radiusX - The x axis radius of the ellipse
	 * @param radiusY - The y axis radius of the ellipse
	 */
	ellipse(x: number, y: number, radiusX: number, radiusY: number): void;
	/**
	 * Creates a circular path.
	 * @param circle - The shape of the circle
	 */
	circle(circle: Circle): void;
	/**
	 * Creates a circular path.
	 * @param center - The center of the circle
	 * @param radius - The radius of the circle
	 */
	circle(center: Vector2, radius: number): void;
	/**
	 * Creates a circular path.
	 * @param x - The x coordinate of the circle's center
	 * @param y - The y coordinate of the circle's center
	 * @param radius - The radius of the circle
	 */
	circle(x: number, y: number, radius: number): void;
	/**
	 * Creates a path in the shape of a sequence of characters.
	 * @param font - The font to use in rendering the text
	 * @param text - The text to render
	 * @param origin - The location of the text's origin. How this is interpreted depends on the current text-alignment mode
	 * @param packWidth - The maximum allowed width of a single line of the text. Specifying this parameter will cause the newlines to be added to enforce this requirement. If this parameter is not specified, the text will not be packed
	 */
	text(font: Font, text: string, origin: Vector2, packWidth?: number): void;
	/**
	 * Creates a path in the shape of a sequence of characters.
	 * @param font - The font to use in rendering the text
	 * @param text - The text to render
	 * @param x - The x coordinate of the text's origin. How this is interpreted depends on the current text-alignment mode
	 * @param y - The y coordinate of the text's origin. How this is interpreted depends on the current text-alignment mode
	 * @param packWidth - The maximum allowed width of a single line of the text. Specifying this parameter will cause the newlines to be added to enforce this requirement. If this parameter is not specified, the text will not be packed
	 */
	text(font: Font, text: string, x: number, y: number, packWidth?: number): void;
	/**
	 * Creates a path with a shape based on the type of its argument.
	 * @param shape - The shape to render
	 */
	infer(shape: Shape): void;
}

/**
 * Represents the draw API of an Artist2D.
 * This fills various paths.
 */
declare class DrawRenderer extends PathRenderer {
	
}

/**
 * Represents the stroke API of an Artist2D.
 * This outlines various paths.
 */
declare class StrokeRenderer extends PathRenderer {
	/**
	 * Renders a line segment. For `.arrow()`, there is also an arrow-head at the end.
	 * @param line - The line segment
	 */
	line(line: Line): void;
	/**
	 * Renders a line segment. For `.arrow()`, there is also an arrow-head at the end.
	 * @param a - The first point
	 * @param b - The second point
	 */
	line(a: Vector2, b: Vector2): void;
	/**
	 * Renders a line segment. For `.arrow()`, there is also an arrow-head at the end.
	 * @param x1 - The x coordinate of the first point
	 * @param y1 - The y coordinate of the first point
	 * @param x2 - The x coordinate of the second point
	 * @param y2 - The y coordinate of the second point
	 */
	line(x1: number, y1: number, x2: number, y2: number): void;
	/**
	 * Renders a line segment. For `.arrow()`, there is also an arrow-head at the end.
	 * @param line - The line segment
	 */
	arrow(line: Line): void;
	/**
	 * Renders a line segment. For `.arrow()`, there is also an arrow-head at the end.
	 * @param a - The first point
	 * @param b - The second point
	 */
	arrow(a: Vector2, b: Vector2): void;
	/**
	 * Renders a line segment. For `.arrow()`, there is also an arrow-head at the end.
	 * @param x1 - The x coordinate of the first point
	 * @param y1 - The y coordinate of the first point
	 * @param x2 - The x coordinate of the second point
	 * @param y2 - The y coordinate of the second point
	 */
	arrow(x1: number, y1: number, x2: number, y2: number): void;
	/**
	 * Renders a series of connected line segments.
	 * @param points - The points to connect
	 */
	connector(points: Vector2[]): void;
	/**
	 * Renders a quartic spline. For `.splineArrow()`, there is also an arrow-head at the end.
	 * @param spline - The spline to render
	 */
	spline(spline: Spline): void;
	/**
	 * Renders a quartic spline. For `.splineArrow()`, there is also an arrow-head at the end.
	 * @param spline - The spline to render
	 */
	splineArrow(spline: Spline): void;
	/**
	 * Renders an arrow-head at the end of an arc on a circle.
	 * @param circle - The circle of which the path is a section
	 * @param begin - The initial clockwise angle (in radians) from the horizontal of the section
	 * @param end - The final clockwise angle (in radians) from the horizontal of the section
	 * @param counterClockwise - Whether the path from the initial to final angle should be counter-clockwise. Default is false
	 */
	arcArrow(circle: Circle, begin: number, end: number, counterClockwise?: boolean): void;
	/**
	 * Renders an arrow-head at the end of an arc on a circle.
	 * @param center - The center of the circle
	 * @param radius - The radius of the circle
	 * @param begin - The initial clockwise angle (in radians) from the horizontal of the section
	 * @param end - The final clockwise angle (in radians) from the horizontal of the section
	 * @param counterClockwise - Whether the path from the initial to final angle should be counter-clockwise. Default is false
	 */
	arcArrow(center: Vector2, radius: number, begin: number, end: number, counterClockwise?: boolean): void;
	/**
	 * Renders an arrow-head at the end of an arc on a circle.
	 * @param x - The x coordinate of the circle's center
	 * @param y - The y coordinate of the circle's center
	 * @param radius - The radius of the circle
	 * @param begin - The initial clockwise angle (in radians) from the horizontal of the section
	 * @param end - The final clockwise angle (in radians) from the horizontal of the section
	 * @param counterClockwise - Whether the path from the initial to final angle should be counter-clockwise. Default is false
	 */
	arcArrow(x: number, y: number, radius: number, begin: number, end: number, counterClockwise?: boolean): void;
	/**
	 * Renders a line segment with a line of text displayed in its center.
	 * @param font - The font to use for the text
	 * @param text - The text to render
	 * @param line - The line segment
	 */
	measure(font: Font, text: string, line: Line): void;
	/**
	 * Renders a line segment with a line of text displayed in its center.
	 * @param font - The font to use for the text
	 * @param text - The text to render
	 * @param a - The first point
	 * @param b - The second point
	 */
	measure(font: Font, text: string, a: Vector2, b: Vector2): void;
	/**
	 * Renders a line segment with a line of text displayed in its center.
	 * @param font - The font to use for the text
	 * @param text - The text to render
	 * @param x1 - The x coordinate of the first point
	 * @param y1 - The y coordinate of the first point
	 * @param x2 - The x coordinate of the second point
	 * @param y2 - The y coordinate of the second point
	 */
	measure(font: Font, text: string, x1: number, y1: number, x2: number, y2: number): void;
	/**
	 * Creates a path with a shape based on the type of its argument.
	 * @param shape - The shape to render
	 */
	infer(shape: Shape | Line | Spline): void;
}

/**
 * Represents the clipping API of an Artist2D.
 * This adds various shapes to the current clipping mask.
 * Each path created will be added to the current clipping state in such a way that the final renderable area is the intersection of all active clip paths.
 */
declare class ClipRenderer extends PathRenderer {
	
}

/**
 * Represents the image drawing API of an Artist2D.
 * This draws images in various paths. 
 * For non-rectangular shapes, the image is scaled to be the size of the shape's bounding box, and then only the portion of the image inside the shape is shown.
 */
declare class ImageRenderer extends PathRenderer {
	/**
	 * Renders an image with a specified height, while still maintaining its natural aspect ratio.
	 * @param point - The upper-left corner of the image
	 * @param height - The height of the image
	 */
	inferWidth(point: Vector2, height: number): void;
	/**
	 * Renders an image with a specified height, while still maintaining its natural aspect ratio.
	 * @param x - The x coordinate of the upper-left corner of the image
	 * @param y - The y coordinate of the upper-left corner of the image
	 * @param height - The height of the image
	 */
	inferWidth(x: number, y: number, height: number): void;
	/**
	 * Renders an image with a specified width, while still maintaining its natural aspect ratio.
	 * @param point - The upper-left corner of the image
	 * @param width - The width of the image
	 */
	inferHeight(point: Vector2, width: number): void;
	/**
	 * Renders an image with a specified width, while still maintaining its natural aspect ratio.
	 * @param x - The x coordinate of the upper-left corner of the image
	 * @param y - The y coordinate of the upper-left corner of the image
	 * @param width - The width of the image
	 */
	inferHeight(x: number, y: number, width: number): void;
	/**
	 * Renders an image at its natural dimensions.
	 * @param point - The upper-left corner of the image
	 */
	default(point: Vector2): void;
	/**
	 * Renders an image at its natural dimensions.
	 * @param x - The x coordinate of the upper-left corner of the image
	 * @param y - The y coordinate of the upper-left corner of the image
	 */
	default(x: number, y: number): void;
}

/**
 * Represents an inclusive interval.
 */
declare class Range implements Copyable {
	/**
	 * The lower bound of the interval
	 */
	min: number;
	/**
	 * The upper bound of the interval
	 */
	max: number;
	/**
	 * Creates a new interval, optionally with a specific min and max.
	 * If the arguments are not in ascending order, they will be reversed.
	 * If no arguments are provided, the interval will be empty. 
	 */
	constructor();
	/**
	 * Creates a new interval, optionally with a specific min and max.
	 * If the arguments are not in ascending order, they will be reversed.
	 * If no arguments are provided, the interval will be empty. 
	 * @param min - The lower bound
	 * @param max - The upper bound
	 */
	constructor(min: number, max: number);
	/**
	 * Returns the mean value of the range.
	 */
	get middle(): number;
	/**
	 * Returns the size of the interval represented by the range.
	 */
	get length(): number;
	/**
	 * Returns the set intersection between the caller and another range.
	 * @param range - The range to clip against
	 */
	clip(range: this): this;
	/**
	 * Returns the distance from a specified value to the closest bound of the range.
	 * If the value is inside the range, the distance will be positive, otherwise, it will be negative.
	 * @param value - The value to check the depth of
	 */
	getDepth(value: number): number;
	/**
	 * Checks whether a value is within the current bounds of the range.
	 * @param value - The value to check
	 */
	includes(value: number): this;
	/**
	 * Expands the range to include a specified value.
	 * @param value - The value to include
	 */
	include(value: number): void;
	/**
	 * Checks if there is any overlap between the caller and another range.
	 * @param range - The range to check against
	 */
	intersect(range: this): boolean;
	/**
	 * Increases the size of the range by evenly moving both bounds away from the center.
	 * @param padding - The amount to change each bound by. For example, a padding value of 10 will increase the length of the range by 20
	 */
	expand(padding: number): void;
	/**
	 * Returns the smallest range that contains every one of a collection of values.
	 * @param values - The set of values to bound
	 */
	static fromValues(values: number[]): Range;
	/**
	 * Creates a copy of the object and optionally stores it in a provided destination.
	 * @param destination - The destination to copy the object into. This must be the same type as the caller
	 */
	get(destination?: this): this;
}

/**
 * Represents a solid shape.
 * Within the documentation of this class, `Vector` refers to either `Vector2` or `Vector3` depending on whether the 2D or 3D subclass is used.
 * Similarly, `Matrix` refers to either `Matrix3` or `Matrix4`.
 * This is an abstract superclass and should not be constructed.
 * All properties of this class are read-only.
 */
declare class Shape<Matrix = any, Vector = any> {
	/**
	 * The geometric center of the shape
	 */
	middle: Vector;
	/**
	 * Returns a copy of the shape after a certain transformation is applied to all its points.
	 * @param transform - The transformation to apply to the shape
	 */
	getModel(transform: Matrix): this;
	/**
	 * Returns a copy of the shape scaled about a specified point.
	 * @param factor - The scale factor on each axis. If this is a number, it applies to all axes equally
	 * @param position - The scaling center. Default is the middle of the shape
	 */
	scale(factor: Vector | number, position?: Vector): this;
	/**
	 * Returns a copy of the shape centered at a specified location.
	 * @param newCenter - The location of the new center
	 */
	center(newCenter: Vector): this;
	/**
	 * Returns a copy of the shape translated by a specified amount.
	 * @param displacement - The amount to displace the shape by
	 */
	move(displacement: Vector): this;
	/**
	 * Checks if two shapes are congruent.
	 * @param other - The Shape to compare against
	 */
	equals(other: this): boolean;
	/**
	 * Checks if two shapes intersect.
	 * @param shape - The Shape to check intersections with
	 */
	intersect(shape: this): boolean;
	/**
	 * Returns the closest point within the shape to a specified other point, including the boundary.
	 * @param point - The target point
	 */
	closestPointTo(point: Vector): Vector;
	/**
	 * Returns the distance from a specified point to the shape.
	 * If the point is inside the shape, this will return 0.
	 * @param point - The target point
	 */
	distanceTo(point: Vector): number;
	/**
	 * Checks if a point is inside the shape, including points on the boundary.
	 * @param point - The point to check
	 */
	containsPoint(point: Vector): boolean;
	/**
	 * Traces a ray until it intersects the caller.
	 * If the ray misses the shape, returns Infinity.
	 * If it hits, it returns the distance that the ray traveled prior to intersection.
	 * @param origin - The starting point of the ray
	 * @param direction - The unit vector in the direction of the ray
	 */
	rayCast(origin: Vector, direction: Vector): number;
	/**
	 * Creates a copy of the object and optionally stores it in a provided destination.
	 * @param destination - The destination to copy the object into. This must be the same type as the caller
	 */
	get(destination?: this): this;
}

/**
 * Represents a 2D shape.
 */
declare class Shape2D extends Shape<Matrix3, Vector2> {
	/**
	 * The area of the shape at the time of construction
	 */
	area: number;
	/**
	 * Returns the smallest axis-aligned rectangle that contains the entire shape.
	 */
	getBoundingBox(): Rect;
}

/**
 * Represents a line segment.
 */
declare class Line extends Shape2D {
	/**
	 * The start point of the line segment
	 */
	a: Vector2;
	/**
	 * The end point of the line segment
	 */
	b: Vector2;
	/**
	 * A vector from the start point of the line segment to the end point
	 */
	vector: Vector2;
	/**
	 * A unit normal vector to the line segment
	 */
	normal: Vector2;
	/**
	 * THe length of the line segment
	 */
	length: number;
	/**
	 * The slope of the line segment. If the line segment is vertical, this is infinite
	 */
	slope: number;
	/**
	 * The y-intercept of the line segment if it were extended into a line
	 */
	intercept: number;
	/**
	 * Creates a new Line.
	 * @param x - The x coordinate of the start point of the line segment
	 * @param y - The y coordinate of the start point of the line segment
	 * @param x2 - The x coordinate of the end point of the line segment
	 * @param y2 - The y coordinate of the end point of the line segment
	 */
	constructor(x: number, y: number, x2: number, y2: number);
	/**
	 * Creates a new Line.
	 * @param start - The start point of the line segment
	 * @param end - The end point of the line segment
	 */
	constructor(start: Vector2, end: Vector2);
	/**
	 * Computes the y coordinate on the line for a given x coordinate. This is calculated as if it were a line, rather than a line segment.
	 * @param x - The x coordinate to calculate the y at.
	 */
	evaluate(x: number): number;
	/**
	 * Creates a new line segment with a specified slope and intercept.
	 * The start point is at the y-intercept, and the end point is at x = 1.
	 * @param m - The slope of the line segment
	 * @param b - The y-intercept of the line segment
	 */
	static fromSlopeIntercept(m: number, b: number): Line;
}

/**
 * Represents a contiguous 2D polygon with no holes.
 */
declare class Polygon extends Shape2D {
	/**
	 * The vertices of the border of the polygon, they are in a clockwise order.
	 */
	vertices: Vector2[];
	/**
	 * Creates a new Polygon.
	 * @param vertices - The vertices for the new polygon. They can be ordered either clockwise or counter-clockwise
	 */
	constructor(vertices: Vector2[]);
	/**
	 * Returns the edges of the polygon.
	 */
	getEdges(): Line[];
	/**
	 * Returns the edges of the polygon.
	 */
	getFaces(): Line[];
	/**
	 * Returns a copy of the polygon rotated clockwise (in Screen-Space) by a specified angle.
	 * @param angle - The angle to rotate by (in radians)
	 */
	rotate(angle: number): this;
	/**
	 * Checks whether a given point is inside the polygon (including the boundary).
	 * The behavior of this method is undefined if the polygon is concave.
	 * @param point - The point to check
	 */
	containsPoint(point: Vector2): boolean;
	/**
	 * Returns a new regular polygon centered at the origin with a specified amount of sides and radius.
	 * @param sides - The number of sides of the polygon
	 * @param radius - The distance from the center to each vertex
	 */
	static regular(sides: number, radius: number): Polygon;
}

/**
 * Represents an axis-aligned rectangle.
 */
declare class Rect extends Polygon {
	/**
	 * The x coordinate of the upper-left corner of the rectangle
	 */
	x: number;
	/**
	 * The y coordinate of the upper-left corner of the rectangle
	 */
	y: number;
	/**
	 * The width of the rectangle
	 */
	width: number;
	/**
	 * The height of the rectangle
	 */
	height: number;
	/**
	 * The upper-left corner of the rectangle
	 */
	min: Vector2;
	/**
	 * The lower-right corner of the rectangle
	 */
	max: Vector2;
	/**
	 * The horizontal interval that contains the rectangle
	 */
	xRange: Range;
	/**
	 * The vertical interval that contains the rectangle
	 */
	yRange: Range;
	/**
	 * Creates a new Rect. The width and height can be negative and will extend the rectangle to the left and top respectively.
	 * @param x - The x coordinate of the upper-left corner of the rectangle
	 * @param y - The y coordinate of the upper-left corner of the rectangle
	 * @param width - The width of the rectangle
	 * @param height - The height of the rectangle
	 */
	constructor(x: number, y: number, width: number, height: number);
	/**
	 * Returns the largest rectangle with a given aspect ratio that fits within the caller, centered at the center of the caller. 
	 * @param width - The width of the hypothetical rectangle from which to determine the aspect ratio
	 * @param height - The height of the hypothetical rectangle from which to determine the aspect ratio
	 */
	largestWithin(width: number, height: number): this;
	/**
	 * Returns the region of intersection between the caller and another rectangle.
	 * @param rect - The rectangle to intersect with
	 */
	clip(rect: this): this;
	/**
	 * Returns a new rectangle with the specified minimum and maximum coordinates.
	 * @param min - The upper-left corner of the rectangle
	 * @param max - The lower-right corner of the rectangle
	 */
	static fromMinMax(min: Vector2, max: Vector2): Rect;
	/**
	 * Returns a new rectangle with the specified vertical and horizontal spans.
	 * @param xRange - The horizontal span of the rectangle
	 * @param yRange - The vertical span of the rectangle
	 */
	static fromRanges(xRange: Range, yRange: Range): Rect;
	/**
	 * Returns the smallest bounding rectangle around a collection of points.
	 * @param points - The points to create a bounding box for
	 */
	static bound(points: Vector2[]): Rect;
	/**
	 * Returns the smallest bounding rectangle around a collection of rectangles.
	 * @param boxes - The rectangles to create a bounding box for
	 */
	static composeBoundingBoxes(boxes: Rect[]): Rect;
}

/**
 * Represents a circle.
 */
declare class Circle extends Shape2D {
	/**
	 * The center of the circle
	 */
	position: Vector2;
	/**
	 * The radius of the circle
	 */
	radius: number;
	/**
	 * Creates a new Circle.
	 * @param position - The center of the circle
	 * @param radius - The radius of the circle
	 */
	constructor(position: Vector2, radius: number);
}

/**
 * Represents a quartic spline with four control points.
 */
declare class Spline<Vector = any> {
	/**
	 * The first control point
	 */
	a: Vector;
	/**
	 * The second control point
	 */
	b: Vector;
	/**
	 * The third control point
	 */
	c: Vector;
	/**
	 * The fourth control point
	 */
	d: Vector;
	/**
	 * Creates a new Spline based on a set of control points.
	 * @param a - The first control point
	 * @param b - The second control point
	 * @param c - The third control point
	 * @param d - The fourth control point
	 */
	constructor(a: Vector, b: Vector, c: Vector, d: Vector);
	/**
	 * Evaluates the point on the spline at a specified parameter value t.
	 * @param t - The parameter value
	 */
	evaluate(t: number): Vector;
}

/**
 * Represents an image that will not change.
 * This image format is more efficient for rendering than other ImageTypes.
 */
declare class StaticImage extends ImageType {
	/**
	 * Creates a new StaticImage.
	 * @param image - The data to use for the static image
	 */
	constructor(image: ImageType);
}

/**
 * Represents a 2D grid of pixels which can be directly accessed and modified.
 * ```js
 * const texture = new Texture(300, 300);
 * 
 * // create a voronoi texture
 * texture.shader((x, y, dest) => {
 * 	const intensity = Random.voronoi2D(x, y, 0.1);
 * 	dest.set(Color.grayScale(intensity));
 * });
 * ```
 */
declare class Texture extends ImageType implements Copyable, Serializable {
	/**
	 * The pixel data of the texture. Modifying this buffer will modify the texture
	 */
	data: ByteBuffer;
	/**
	 * Whether or not pixel coordinate parameters to methods will be wrapped around the edges of the texture space
	 */
	loops: boolean;
	/**
	 * Returns a 2D array of the colors for all pixels in the texture.
	 * The first index is the x coordinate, the second the y
	 */
	get pixels(): Color[][];
	/**
	 * Returns a 2D array of the brightness values for all pixels in the texture.
	 * The first index is the x coordinate, the second the y.
	 */
	get brightness(): number[][];
	/**
	 * Returns a 2D array of the red channel values for all pixels in the texture.
	 * The first index is the x coordinate, the second the y.
	 */
	get red(): number[][];
	/**
	 * Returns a 2D array of the green channel values for all pixels in the texture.
	 * The first index is the x coordinate, the second the y.
	 */
	get green(): number[][];
	/**
	 * Returns a 2D array of the blue channel values for all pixels in the texture.
	 * The first index is the x coordinate, the second the y.
	 */
	get blue(): number[][];
	/**
	 * Returns a 2D array of the alpha channel values for all pixels in the texture.
	 * The first index is the x coordinate, the second the y.
	 */
	get alpha(): number[][];
	/**
	 * Clears the texture to contain only transparent black pixels.
	 */
	clear(): void;
	/**
	 * Checks whether the given coordinates are valid pixel coordinates.
	 * This method ignores potential coordinate wrapping. 
	 * @param x - The x coordinate to check
	 * @param y - The y coordinate to check
	 */
	validPixel(x: number, y: number): boolean;
	/**
	 * Returns a reference to the color of the pixel at a specific location.
	 * This color object is managed by the texture, and will only be valid until the next call to this method.
	 * If the color data is needed more permanently, create a copy of the return value.
	 * @param x - The x coordinate of the pixel
	 * @param y - The y coordinate of the pixel
	 * @param valid - Whether or not the pixel coordinates are known to be valid. Default is false
	 */
	getPixel(x: number, y: number, valid?: boolean): Color;
	/**
	 * Applies an in-place mapping to every pixel in the texture. Returns the caller.
	 * @param mapping - A shader function called for every pixel. The return value of this function, but it takes in three arguments: the x and y coordinates of the pixel, and the pixel color. Modifying the state of the pixel color argument will change the pixel color in the texture
	 */
	shader(mapping: (arg0: number, arg1: number, arg2: Color) => void): this;
	/**
	 * Changes the color of a specified pixel in the texture.
	 * @param x - The x coordinate of the pixel
	 * @param y - The y coordinate of the pixel
	 * @param color - The new color of the pixel
	 * @param valid - Whether or not the pixel coordinates are known to be valid. Default is false
	 */
	setPixel(x: number, y: number, color: Color, valid?: boolean): void;
	/**
	 * Applies an in-place box blur with a specified radius to the texture. Returns the caller.
	 * @param radius - The radius of the box blur
	 */
	blur(radius: number): this;
	/**
	 * Returns a texture containing a rectangular region of the caller. 
	 * @param region - The region to extract
	 */
	clip(region: Rect): this;
	/**
	 * Returns a texture containing a rectangular region of the caller. 
	 * @param x - The x coordinate of the upper-left corner of the region.
	 * @param y - The y coordinate of the upper-left corner of the region.
	 * @param width - The width of the region
	 * @param height - The height of the region
	 */
	clip(x: number, y: number, width: number, height: number): this;
	/**
	 * Returns a texture containing the (optionally clipped) contents of an image.
	 * If no clipping parameters are provided, the whole image will be copied.
	 * The copy will have the same dimensions as the original, so if the original has a pixel ratio greater than 1, this operation will result in a loss of detail.
	 * @param image - The image to copy data from
	 */
	static fromImageType(image: ImageType): Texture;
	/**
	 * Returns a texture containing the (optionally clipped) contents of an image.
	 * If no clipping parameters are provided, the whole image will be copied.
	 * The copy will have the same dimensions as the original, so if the original has a pixel ratio greater than 1, this operation will result in a loss of detail.
	 * @param image - The image to copy data from
	 * @param region - The region to extract
	 */
	static fromImageType(image: ImageType, region: Rect): Texture;
	/**
	 * Returns a texture containing the (optionally clipped) contents of an image.
	 * If no clipping parameters are provided, the whole image will be copied.
	 * The copy will have the same dimensions as the original, so if the original has a pixel ratio greater than 1, this operation will result in a loss of detail.
	 * @param image - The image to copy data from
	 * @param x - The x coordinate of the upper-left corner of the region.
	 * @param y - The y coordinate of the upper-left corner of the region.
	 * @param width - The width of the region
	 * @param height - The height of the region
	 */
	static fromImageType(image: ImageType, x: number, y: number, width: number, height: number): Texture;
	/**
	 * Creates a new grayscale texture based on a 2D grid of brightness values.
	 * @param brightness - The brightness values for each pixel in the texture. The first index is the x coordinate, the second the y
	 */
	static grayScale(brightness: number[][]): Texture;
	/**
	 * Returns a promise resolving to a new texture containing the image data from a data: url.
	 * @param url - The data: url
	 */
	static fromDataURI(url: string): Promise;
	/**
	 * Creates a copy of the object and optionally stores it in a provided destination.
	 * @param destination - The destination to copy the object into. This must be the same type as the caller
	 */
	get(destination?: this): this;
	/**
	 * Writes the object to a buffer and returns it.
	 * @param buffer - A destination buffer to write the result to. If not specified, a new buffer will be created
	 */
	toByteBuffer(buffer?: ByteBuffer): ByteBuffer;
	/**
	 * Creates an instance of the class based on data read from the current pointed-to location in a buffer. This increments the buffer's pointer to after the data of the instance.
	 * @param buffer - A source buffer to read the data from
	 */
	static fromByteBuffer(buffer: ByteBuffer): Serializable;
}

/**
 * Represents a collection of sprites contained within a single image.
 * ```js
 * const spriteSheet = loadResource("sprites.png"); // 32 x 32
 * const tileMap = TileMap.regular(spriteSheet, 16, 16, ["cat", "dog", "fish", "creature"]); // extract 4 tiles
 * 
 * renderer.image(tileMap.get("fish")).rect(0, 0, 64, 64);
 * ```
 */
declare class TileMap {
	/**
	 * Creates a new TileMap.
	 * @param image - The overall sprite sheet
	 * @param sections - The regions of the sprite sheet assigned to each sprite. Each entry in this list has a `.name` property, which is any unique identifier for the sprite, and a `.area` property representing the natural region of the sprite sheet assigned to this name
	 */
	constructor(image: ImageType, sections: { name: any, area: Rect }[]);
	/**
	 * Retrieves a specific sprite from the sprite sheet.
	 * @param name - The identifier of a specific sprite
	 */
	get(name: any): ImageType;
	/**
	 * Creates a tile map based on a series of contiguous, fixed-size, left-to-right, top-to-bottom tiles.
	 * @param image - The sprite sheet
	 * @param tileWidth - The width of each tile
	 * @param tileHeight - The height of each tile
	 * @param names - The list of identifiers for each tile
	 */
	static regular(image: ImageType, tileWidth: number, tileHeight: number, names: any[]): TileMap;
}

/**
 * Represents an affine transformation with no scaling.
 * It is composed of a rotation about the origin followed by a translation.
 * Within the documentation for this class, `Angle` refers to either `Number` or `Vector3` depending on whether the 2D or 3D subclass is being used.
 * Similarly, `Vector` refers to either `Vector2` or `Vector3` and `Matrix` refers to either `Matrix3` or `Matrix4` depending on the dimension used.
 * This is an abstract superclass and should not be constructed.
 * ```js
 * const obj = scene.main.addElement("my first object", 0, 0);
 * console.log(obj.transform); // { position: (0, 0), rotation: 0 }
 * 
 * obj.transform.rotateAbout(new Vector2(0, 100), Math.PI);
 * console.log(obj.transform); // { position: (0, 200), rotation: Math.PI }
 * ```
 */
declare class Transform<Matrix, Vector, Angle> {
	/**
	 * The translation of the transform
	 */
	position: Vector;
	/**
	 * The angle of rotation (in radians) of the transform
	 */
	rotation: Angle;
	/**
	 * Returns a transform that, when composed with the caller, will produce no offset and no rotation.
	 */
	get inverse(): this;
	/**
	 * Returns a matrix representing the current transformation from local to global space.
	 */
	get matrix(): Matrix;
	/**
	 * Returns a matrix representing the current transformation from global to local space.
	 */
	get invMatrix(): Matrix;
	/**
	 * Returns a unit vector in the direction of the x axis in local space.
	 */
	get direction(): Vector;
	/**
	 * Transforms a given point by applying the inverse of the caller to it.
	 * This translates the point by the inverse of the transform's position and then rotates it counter-clockwise (in Screen-Space) about the origin by the transform's rotation.
	 * @param point - The point to transform
	 */
	globalToLocal(point: Vector): Vector;
	/**
	 * Transforms a given point by applying the caller to it.
	 * This rotates the point clockwise (in Screen-Space) about the origin by the transform's rotation and then translates it by the transform's position.
	 * @param point - The point to transform
	 */
	localToGlobal(point: Vector): Vector;
	/**
	 * Returns a transform which has the same effect as applying two transformations in a row.
	 * @param a - The first transformation
	 * @param b - The second transformation
	 */
	static combine(a: Transform, b: Transform): Transform;
	/**
	 * Creates a copy of the object and optionally stores it in a provided destination.
	 * @param destination - The destination to copy the object into. This must be the same type as the caller
	 */
	get(destination?: this): this;
}

/**
 * Represents a 2D affine transformation, composed of a translation and a rotation.
 */
declare class Transform2D extends Transform<Matrix3, Vector2, Number> {
	/**
	 * The translation of the transform
	 */
	position: Vector2;
	/**
	 * The angle of rotation
	 */
	rotation: number;
	/**
	 * Creates a new 2D transform.
	 * @param position - The translation of the transform
	 * @param rotation - The angle of rotation. Default is 0
	 */
	constructor(position: Vector2, rotation?: number);
	/**
	 * Adds a clockwise (in Screen-Space) rotation in-place about a specific point to the existing transformation. 
	 * @param point - The center to rotate about
	 * @param rotation - The angle (in radians) to rotate by
	 */
	rotateAround(point: Vector2, rotation: number): void;
}

/**
 * Represents a 3D affine transformation, composed of a translation and a rotation about an arbitrary axis.
 */
declare class Transform3D extends Transform<Matrix4, Vector3, Vector3> {
	/**
	 * The translation of the transform
	 */
	position: Vector3;
	/**
	 * The angle of rotation, represented as the unit axis of rotation multiplied by the angle of rotation
	 */
	rotation: Vector3;
	/**
	 * Creates a new 3D transform.
	 * @param position - The translation of the transform
	 * @param rotation - The angle of rotation. Default is no rotation
	 */
	constructor(position: Vector3, rotation?: Vector3);
}

/**
 * Represents a video that can have the current frame rendered.
 * These should be loaded using HengineVideoResource and not constructed directly.
 */
declare class VideoView extends ImageType {
	/**
	 * Whether or not the video loops.
	 */
	loops: boolean;
	/**
	 * Whether or not the video is currently playing. This value is read-only
	 */
	playing: boolean;
	/**
	 * Returns a copy of the current frame of the video.
	 */
	getFrame(): Frame;
	/**
	 * Pauses playback of the video.
	 */
	pause(): void;
	/**
	 * Resumes playback of the video.
	 */
	play(): void;
}

/**
 * Represents a video feed from a webcam that can be used as an image.
 * These should be loaded using HengineWebcamResource and not constructed directly.
 */
declare class WebcamCapture extends ImageType {
	/**
	 * Whether or not the webcam is capturing new frames
	 */
	recording: boolean;
	/**
	 * Returns a copy of the current view from the webcam.
	 */
	getFrame(): Frame;
	/**
	 * Stops the webcam from recording.
	 */
	pause(): void;
	/**
	 * Resumes recording from the webcam.
	 */
	play(): void;
}

/**
 * Represents a 2D renderer based on the WebGL API.
 * This renderer cannot render text or concave polygons.
 * Creating instances of this class is drastically more expensive than creating a CanvasArtist2D, but after it's created, it is generally 10x-100x faster than CanvasArtist2D.
 * Since this is implemented using WebGL, creating a high number of instances of this class should be avoided to prevent context-switching overhead.
 * This should not be constructed directly, and should instead be used in conjunction with FastFrame.
 */
declare class WebGLArtist2D extends Artist2D {
	
}

/**
 * Represents a WebGL-based implementation of Frame.
 */
declare class FastFrame extends Frame {
	/**
	 * The renderer for the frame
	 */
	renderer: WebGLArtist2D;
}

/**
 * Represents a cube map usable in via a GPUInterface.
 * All faces must be square and equal in size.
 */
declare interface CubeMap {
	/**
	 * The face of the cube map on the positive x side. If this is a Sampler, the sampling strategy will be used on all sides
	 */
	posX: ImageType | Sampler;
	/**
	 * The face of the cube map on the negative x side
	 */
	negX: ImageType;
	/**
	 * The face of the cube map on the positive y side
	 */
	posY: ImageType;
	/**
	 * The face of the cube map on the negative y side
	 */
	negY: ImageType;
	/**
	 * The face of the cube map on the positive z side
	 */
	posZ: ImageType;
	/**
	 * The face of the cube map on the negative z side
	 */
	negZ: ImageType;
}

/**
 * Represents an array of GLSL structs.
 * These structs may be nested.
 * These are used to represent GLSL dynamic-length array uniforms and the output of GPUComputations, but should not be constructed directly.
 * For a struct such as:
 * ```glsl
 * struct Circle {
 * 	vec2 position;
 * 	float radius;
 * 	vec3 color;
 * };
 * ```
 * A GPUArray could be used as follows:
 * ```js
 * // gpu is a GPUInterface
 * const circle = {
 * 	position: new Vector2(100, 200),
 * 	radius: 22.5,
 * 	color: new Color("magenta")
 * };
 * gpu.getUniform("circles").append(circle);
 * ```
 */
declare class GPUArray {
	/**
	 * A buffer containing all the structs' data. This can be read from freely at any location, but cannot be written to
	 */
	buffer: ByteBuffer;
	/**
	 * Retrieves the number of structs in the array.
	 */
	get length(): number;
	/**
	 * Sets the value of the array and returns the caller.
	 * This will overwrite all previous data.
	 * @param value - An array of objects with the same structure as the struct
	 */
	set(value: object[]): this;
	/**
	 * Sets the value of the array and returns the caller.
	 * This will overwrite all previous data.
	 * @param value - Another GPU array to copy from. This must represent the same type of structs. Using this signature is faster, and should be done whenever possible
	 */
	set(value: this): this;
	/**
	 * Appends a struct to the end of the array and returns the caller.
	 * @param value - An object with the same structure as the struct
	 */
	append(value: object): this;
	/**
	 * Writes to a specified location in the array and returns the caller.
	 * This may increase the size of the array, but cannot be used to create holes.
	 * @param data - An array of objects with the same structure as the struct
	 * @param offset - The first index to write to in the array. Default is 0
	 * @param length - The amount of elements to write. If not specified, this will be as many as possible
	 * @param srcOffset - The first index to read from the data argument. If not specified, this will be the same as the offset argument
	 */
	write(data: object[], offset?: number, length?: number, srcOffset?: number): this;
	/**
	 * Reads from a specified location in the array into a provided array of objects, and returns the destination array.
	 * @param data - An array of objects with the same structure as the struct
	 * @param offset - The first index to read from in the array. Default is 0
	 * @param length - The amount of elements to read. If not specified, this will be as many as possible
	 * @param dstOffset - The first index to write to in the data argument. If not specified, this will be the same as the offset argument
	 */
	read(data: object[], offset?: number, length?: number, dstOffset?: number): object[];
}

/**
 * Represents the way in which samples of an image are interpolated in GLSL.
 */
declare enum FilterMode {
	/**
	 * The exact value of the nearest texel is used as the sample
	 */
	NEAREST,
	/**
	 * The values of the 4 nearest texels are linearly interpolated to produce the sample
	 */
	LINEAR
}

/**
 * Describes how a Sampler should be constructed.
 * All properties of this interface are optional.
 */
declare interface SamplerSettings {
	/**
	 * Whether the samples will repeat when out-of-bounds coordinates are used. Default is false
	 */
	wrap?: boolean;
	/**
	 * How the samples should be interpolated when sampling from non-integer coordinates. Default is `FilterMode.NEAREST` for Textures, and `FilterMode.LINEAR` for all others
	 */
	filter?: FilterMode;
	/**
	 * Whether sampling at shallow angles should be done on down-scaled mipmaps instead of the full-resolution image. Default is false
	 */
	mipmap?: boolean;
}

/**
 * This describes the way in which a GLSL `sampler*` reads data from a texture.
 * This can be used in place of an ImageType when specifying a `sampler*` uniform.
 */
declare class Sampler {
	/**
	 * 
	 * @param image - The image(s) to sample from
	 * @param settings - How the sampler should be configured. Default is an empty object
	 */
	constructor(image: ImageType | ImageType[] | CubeMap, settings?: SamplerSettings);
}

/**
 * Represents a GLSL program.
 */
declare interface GPUInterface {
	/**
	 * The source code of the program
	 */
	glsl: string;
	/**
	 * Sets the value of a uniform in the program.
	 * @param name - The name of the uniform
	 * @param value - The new value for the uniform. For the type of this argument, see the GLSL API
	 */
	setUniform(name: string, value: any): void;
	/**
	 * Sets the value of many uniforms at once.
	 * @param uniforms - A set of key-value pairs, where the key represents the uniform name, and the value represents the uniform value
	 */
	setUniforms(uniforms: object): void;
	/**
	 * Retrieves the current value of a given uniform.
	 * For the return type of this function, see the GLSL API.
	 * @param name - The name of the uniform
	 */
	getUniform(name: string): any;
	/**
	 * Checks whether a given uniform exists.
	 * @param name - The name of the uniform to check
	 */
	argumentExists(name: string): boolean;
}

/**
 * Represents the camera in a 3D scene.
 */
declare class Camera3D extends Matrix4 implements Camera<Vector3> {
	/**
	 * The direction the camera is facing. This must be a unit vector, and starts as (0, 0, 1)
	 */
	direction: Vector3;
	/**
	 * The product of the camera's projection matrix and itself. This property is read-only and only updates when cacheScreen() is called
	 */
	pcMatrix: Matrix4;
	/**
	 * Creates a new camera at (0, 0, 0) pointing toward the positive z axis.
	 * @param canvas - The surface to target
	 */
	constructor(canvas: ImageType);
	/**
	 * Returns the World-Space frustum of the camera, and synchronizes `.screen` and `.pcMatrix` to match the location and orientation of the camera. 
	 */
	get screen(): Frustum;
	/**
	 * Returns the projection matrix of the camera.
	 * This may vary as the dimensions of the rendering surface change.
	 */
	get projection(): Matrix4;
	/**
	 * Configures the camera to use a custom projection.
	 * @param projection - The homogenous projection matrix to use
	 */
	set projection(projection: Matrix4);
	/**
	 * Configures the camera to use a perspective projection.
	 * @param fov - The field of view of the camera in radians
	 * @param zNear - The location of the near clipping plane
	 * @param zFar - The location of the far clipping plane
	 */
	perspective(fov: number, zNear: number, zFar: number): void;
	/**
	 * Configures the camera to use a orthographic projection.
	 * @param span - The size of the x and y spans included in the projection
	 * @param depth - The maximum depth included in the projection
	 */
	orthographic(span: number, depth: number): void;
	/**
	 * Points the camera in a specific direction, with a specified angle from +z on the horizontal and vertical axes.
	 * The vertical input is clamped to avoid gimbal lock.
	 * @param xAngle - The angle in radians about the y axis from +z to the camera direction
	 * @param yAngle - The angle in radians about the x axis from +z to the camera direction
	 */
	look(xAngle: number, yAngle: number): void;
	/**
	 * The location of the camera in World-Space
	 */
	position: Vector;
	/**
	 * The magnification level of the camera
	 */
	zoom: number;
	/**
	 * The clockwise roll (in radians) of the camera. Starts at 0
	 */
	rotation: number;
	/**
	 * Returns the caller.
	 */
	get matrix(): Matrix;
	/**
	 * Sets the zoom to 1.
	 */
	restoreZoom(): void;
	/**
	 * Zooms in by a specified amount.
	 * @param amount - The amount to zoom in by
	 */
	zoomIn(amount: number): void;
	/**
	 * Zooms out by a specified amount.
	 * @param amount - The amount to zoom out by
	 */
	zoomOut(amount: number): void;
	/**
	 * Multiplies the current zoom value.
	 * @param factor - The amount to multiply the current zoom
	 */
	zoomBy(factor: number): void;
	/**
	 * Maps a given point from Camera-Space to World-Space.
	 * @param point - The point to transform
	 */
	cameraToWorld(point: Vector): Vector;
	/**
	 * Maps a given point from World-Space to Camera-Space.
	 * @param point - The point to transform
	 */
	worldToCamera(point: Vector): Vector;
	/**
	 * Assuming the renderer is currently in Camera-Space, transforms to World-Space, calls a rendering function, and then transforms back to Camera-Space.
	 * @param render - The function to call while in the World-Space context
	 */
	drawInWorldSpace(render: () => void): void;
	/**
	 * Assuming the renderer is currently in World-Space, transforms to Camera-Space, calls a rendering function, and then transforms back to World-Space.
	 * @param render - The function to call while in the Camera-Space context
	 */
	drawInCameraSpace(render: () => void): void;
}

/**
 * Represents an offscreen image onto which 3D graphics can be drawn.
 * By default, rendering will be done in the frame's World-Space, though this can be changed via `.camera.drawInCameraSpace()`.
 */
declare class Frame3D extends ImageType {
	/**
	 * The renderer which can be used to add meshes and lights to the frame. This property is read-only
	 */
	renderer: Artist3D;
	/**
	 * The view from which the objects will be rendered
	 */
	camera: Camera3D;
	/**
	 * Creates a new Frame3D.
	 * @param width - The natural width of the canvas
	 * @param height - The natural height of the canvas
	 * @param pixelRatio - The width, in pixels, of a single unit of natural width in the image. Default is the pixel ratio for the user's monitor
	 */
	constructor(width: number, height: number, pixelRatio?: number);
}

/**
 * Represents a material applied to a MeshChunk.
 */
declare class Material {
	/**
	 * Whether or not light can pass through the material
	 */
	transparent: boolean;
}

/**
 * Represents a custom shader-based material with a user-specified vertex and fragment shader programs.
 */
declare class ShaderMaterial extends Material {
	/**
	 * Creates a new custom material.
	 */
	constructor();
}

/**
 * Represents a basic parameterized material based on the Blinn-Phong Shading Model.
 */
declare class SimpleMaterial extends Material {
	/**
	 * The base color of the material, against which ambient and diffuse lighting are calculated. Starts as white
	 */
	albedo: Color;
	/**
	 * The color of light emitted from the material. Starts as black
	 */
	emission: Color;
	/**
	 * The color of specular highlights on the material. Starts as white
	 */
	specular: Color;
	/**
	 * The texture to use in in place of the `.albedo` color. It will sampled according to the mesh's UVs
	 */
	albedoTexture: ImageType | Sampler;
	/**
	 * The texture to use in in place of the `.specular` color. It will sampled according to the mesh's UVs
	 */
	specularTexture: ImageType | Sampler;
	/**
	 * The exponent applied during specular highlight calculation. Higher values correspond to sharper highlights. Starts as 0
	 */
	specularExponent: number;
	/**
	 * The opacity of the material. Starts as 1
	 */
	alpha: number;
	/**
	 * Creates a new material based on certain surface settings.
	 * @param settings - An object where each entry corresponds to a property of SimpleMaterial
	 */
	constructor(settings: object);
	/**
	 * Sets `.albedo`, `.specular`, and `.emission` to the same value.
	 * @param color - The new color value
	 */
	set color(color: Color);
}

/**
 * Represents an object that is able to store a subset of renderable mesh data.
 * This is an abstract superclass and should not be constructed.
 */
declare class Renderable {
	/**
	 * Pushes post-construction vertex updates to the GPU for rendering.
	 * This function must be called before updates will be visible in rendering.
	 */
	flush(): void;
}

/**
 * Represents a 3D mesh composed of chunks with different materials. The following vertex attributes are supported:
 * <table>
 * 	<tr><th>Attribute Name</th><th>Meaning</th><th>Type</th></tr>
 * 	<tr><td>`vertexPosition`</td><td>The model-space location of the vertex</td><td>Vector3</td></tr>
 * 	<tr><td>`vertexUV`</td><td>The UV texture coordinates of the vertex</td><td>Vector2</td></tr>
 * 	<tr><td>`vertexNormal`</td><td>The normalized normal vector of the vertex</td><td>Vector3</td></tr>
 * </table>
 */
declare class Mesh extends Renderable {
	/**
	 * The vertex attributes present in the mesh's data. This value is read-only
	 */
	attributes: string[];
	/**
	 * The vertex data of the mesh, interleaved in the order specified by `.attributes`
	 */
	data: Float32Array;
	/**
	 * The chunks of the mesh, describing the layout of mesh's faces
	 */
	chunks: MeshChunk[];
	/**
	 * A list of each vertex in the vertex data. Each element of this array has a property for each attribute of the mesh. This property is synchronized with `.data`
	 */
	vertices: ArrayLike;
	/**
	 * The number of elements each vertex takes up in the data array. This value is read-only
	 */
	stride: number;
	/**
	 * A map from attribute names to their offset into each vertex in the data array. This value is read-only
	 */
	offsets: Map;
	/**
	 * Creates a new mesh.
	 * @param attributes - The vertex attributes in the mesh data
	 * @param data - The vertex data of the mesh, either as a float buffer or a list of vertex objects
	 * @param chunks - The chunks of the mesh
	 */
	constructor(attributes: string[], data: Float32Array | ArrayLike, chunks: MeshChunk[]);
	/**
	 * Creates a deep copy of the mesh.
	 */
	get(): this;
	/**
	 * Transforms the `vertexPosition` of the mesh in-place by a given matrix and flushes the changes.
	 * Returns the caller.
	 * @param transform - The homogenous transformation to apply to each vertex position
	 */
	transform(transform: Matrix4): this;
	/**
	 * Creates a Polyhedron that has the same shape as the mesh, using the `vertexPosition` attribute.
	 */
	toPolyhedron(): Polyhedron;
	/**
	 * Creates a new mesh from a Polyhedron.
	 * @param polyhedron - The object to use for the mesh
	 * @param material - The material for the mesh. Default is `Material.DEFAULT`
	 */
	static fromPolyhedron(polyhedron: Polyhedron, material?: Material): Mesh;
	/**
	 * Creates a new mesh containing all the pieces of a collection of meshes
	 * @param meshes - The meshes to combine
	 */
	static merge(meshes: Mesh[]): Mesh;
}

/**
 * Represents the faces of a piece of a 3D Mesh with a single material.
 */
declare class MeshChunk extends Renderable {
	/**
	 * The material of the chunk
	 */
	material: Material;
	/**
	 * The index buffer for the chunk. Every 3 consecutive elements of this array represent a triangular face of the mesh, where the each element is an index into the vertices of the mesh
	 */
	indices: Uint32Array;
	/**
	 * A list of the faces of the chunk, as 3-length arrays of numbers. This property is synchronized with `.indices`
	 */
	faces: ArrayLike;
	/**
	 * Creates a new mesh chunk.
	 * @param material - The material for the chunk
	 * @param faces - A list of 3-length arrays of numbers or an int buffer, representing the triangles of the chunk
	 */
	constructor(material: Material, faces: Uint32Array | ArrayLike);
	/**
	 * Creates a deep copy of the mesh chunk.
	 */
	get(): this;
}

/**
 * Provides a set of methods for creating different types of lights in a 3D scene.
 * This class should not be constructed, and should be accessed via `Artist3D.prototype.light`.
 */
declare class LightRenderer {
	/**
	 * Queues an ambient light to be rendered.
	 * This light will affect all objects from all sides equally.
	 */
	ambient(): void;
	/**
	 * Queues an ambient light to be rendered.
	 * This light will affect all objects outwards from a specific source.
	 * @param position - The location of the point light
	 */
	point(position: Vector3): void;
	/**
	 * Queues a directional light to be rendered.
	 * This light emits parallel rays from an infinite distance in a given direction.
	 * @param direction - The direction of the light
	 * @param shadow - Whether the light casts shadows. Default is true
	 */
	directional(direction: Vector3, shadow?: boolean): void;
}

/**
 * Provides a set of methods for rendering meshes in various ways in a scene.
 * This class should not be constructed, and should be accessed via `Artist3D.prototype.mesh`.
 */
declare class MeshRenderer {
	/**
	 * Renders the current mesh at the current transform origin.
	 * @param castShadows - Whether the mesh should cast shadows. If the same mesh is rendered multiple times, any of them choosing to cast shadows will lead to all of them casting shadows. Default is true
	 */
	default(castShadows?: boolean): void;
	/**
	 * Renders the current mesh at a given transform relative to the current transform.
	 * @param transform - The transform at which the mesh will be rendered
	 * @param castShadows - Whether the mesh should cast shadows. If the same mesh is rendered multiple times, any of them choosing to cast shadows will lead to all of them casting shadows. Default is true
	 */
	at(transform: Matrix4, castShadows?: boolean): void;
	/**
	 * Renders the current mesh at a variety of different transforms relative to the current transform.
	 * @param transforms - The transformations to use for each instance
	 * @param castShadows - Whether the mesh should cast shadows. If the same mesh is rendered multiple times, any of them choosing to cast shadows will lead to all of them casting shadows. Default is true
	 */
	instance(transforms: Matrix4[], castShadows?: boolean): void;
}

/**
 * Represents a 3D renderer for a graphical surface.
 * All transformation-related matrices for this renderer are of type Matrix4.
 */
declare class Artist3D extends Artist {
	/**
	 * Returns an object with various methods for queueing lights to be rendered.
	 * @param color - The color of the light
	 */
	light(color: Color): LightRenderer;
	/**
	 * Returns an object with various methods for queueing meshes to be rendered.
	 * @param mesh - The mesh to be rendered
	 */
	mesh(mesh: Mesh): MeshRenderer;
}

/**
 * Represents a 3D shape.
 */
declare class Shape3D extends Shape<Matrix4, Vector3> {
	/**
	 * The amount of space contained within the shape
	 */
	volume: number;
	/**
	 * Returns the smallest axis-aligned rectangular prism that contains the entire shape.
	 */
	getBoundingBox(): Prism;
}

/**
 * Represents a line segment in 3D space.
 */
declare class Line3D extends Shape3D {
	/**
	 * The beginning of the line segment
	 */
	a: Vector3;
	/**
	 * The end of the line segment
	 */
	b: Vector3;
	/**
	 * The length of the line segment
	 */
	length: number;
	/**
	 * The vector from `.a` to `.b`
	 */
	vector: Vector3;
}

/**
 * Represents a triangle in 3D space.
 */
declare class Triangle extends Shape3D {
	/**
	 * The first vertex of the triangle
	 */
	a: Vector3;
	/**
	 * The second vertex of the triangle
	 */
	b: Vector3;
	/**
	 * The third vertex of the triangle
	 */
	c: Vector3;
	/**
	 * The unit surface normal of the triangle
	 */
	normal: Vector3;
	/**
	 * The area of the triangle
	 */
	area: number;
	/**
	 * Creates a new triangle.
	 * @param points - The points of the triangle
	 */
	constructor(...points: Vector3[]);
	/**
	 * Returns the plane in which the triangle resides.
	 */
	get plane(): Plane;
}

/**
 * Represents a closed 3D polyhedron as a collection of contiguous triangles.
 */
declare class Polyhedron extends Shape3D {
	/**
	 * The vertices of the polyhedron
	 */
	vertices: Vector3[];
	/**
	 * An array representing the triangles of the polyhedron. Every three indices in the array specify the locations in the `.vertices` array which make up a triangle
	 */
	indices: number[];
	/**
	 * Returns a set of unique lines that represent the edges of the faces of the polyhedron.
	 */
	getEdges(): Line3D[];
	/**
	 * Returns a set of triangles making up the surface of the polyhedron.
	 */
	getFaces(): Triangle[];
	/**
	 * Subdivides each triangle in the polyhedron into a power of 4 number of additional triangles.
	 * The subdivided mesh is a copy and is returned.
	 * @param count - The power of 4 to multiply the triangle count by. Default is 1
	 */
	subdivide(count?: number): this;
	/**
	 * Creates a new polyhedron by transforming every vertex using a given function.
	 * @param vertexTransform - The function to apply to each vertex
	 */
	map(vertexTransform: (arg0: Vector3) => Vector3): this;
	/**
	 * Creates a new polyhedron from a list of triangles which form a closed surface.
	 * @param triangles - The triangles to use as the surface
	 */
	static fromTriangles(triangles: Triangle[]): Polyhedron;
	/**
	 * Creates a polyhedron that resembles a sphere to a given level of precision.
	 * @param sphere - The sphere to approximate
	 * @param subdivisions - The amount of times to apply `.subdivide()` to the sphere. Default is 2
	 */
	static fromSphere(sphere: Sphere, subdivisions?: number): Polyhedron;
	/**
	 * Creates a polyhedron that resembles a cylinder to a given level of precision.
	 * @param cylinder - The cylinder to approximate
	 * @param steps - The amount of vertices to use around the circular faces. Default is 8
	 */
	static fromCylinder(cylinder: Cylinder, steps?: number): Polyhedron;
}

/**
 * Represents an axis-aligned rectangular prism.
 */
declare class Prism extends Polyhedron {
	/**
	 * The C coordinate of the left-upper-front corner
	 */
	x: number;
	/**
	 * The C coordinate of the left-upper-front corner
	 */
	y: number;
	/**
	 * The C coordinate of the left-upper-front corner
	 */
	z: number;
	/**
	 * The x axis size of the prism
	 */
	width: number;
	/**
	 * The y axis size of the prism
	 */
	height: number;
	/**
	 * The z axis size of the prism
	 */
	depth: number;
	/**
	 * The interval of the C axis occupied by the prism
	 */
	xRange: Range;
	/**
	 * The interval of the C axis occupied by the prism
	 */
	yRange: Range;
	/**
	 * The interval of the C axis occupied by the prism
	 */
	zRange: Range;
	/**
	 * The left-upper-front corner
	 */
	min: Vector3;
	/**
	 * The right-lower-back corner
	 */
	max: Vector3;
	/**
	 * Creates a new rectangular prism.
	 * @param min - The left-upper-front corner of the prism
	 * @param max - The right-lower-back corner of the prism
	 */
	constructor(min: Vector3, max: Vector3);
	/**
	 * Returns a prism representing the points in both the caller and another given prism.
	 * @param prism - The prism to intersect with
	 */
	clip(prism: this): this;
	/**
	 * Creates a rectangular prism from a set of intervals.
	 * @param xRange - The interval on the x axis occupied by the prism
	 * @param yRange - The interval on the y axis occupied by the prism
	 * @param zRange - The interval on the z axis occupied by the prism
	 */
	static fromRanges(xRange: Range, yRange: Range, zRange: Range): Prism;
	/**
	 * Creates a rectangular prism from a given minimum and maximum point.
	 * @param min - The left-upper-front corner of the prism
	 * @param max - The right-lower-back corner of the prism
	 */
	static fromMinMax(min: Vector3, max: Vector3): Prism;
	/**
	 * Computes the smallest rectangular prism that contains a set of points and returns it.
	 * @param points - The points to contain
	 */
	static bound(points: Vector3[]): Prism;
	/**
	 * Computes the smallest bounding rectangular prism the contains a set of other rectangular prisms.
	 * @param boxes - The boxes to contain
	 */
	static composeBoundingBoxes(boxes: Prism[]): Prism;
}

/**
 * Represents an infinite plane in 3D space.
 */
declare class Plane extends Shape3D {
	/**
	 * The unit normal vector to the plane
	 */
	normal: Vector3;
	/**
	 * The distance from the plane to the origin
	 */
	distance: number;
	/**
	 * Creates a new plane.
	 */
	constructor();
}

/**
 * Represents the frustum of a projection matrix.
 * This is the space projected (via a perspective divide) by a given matrix into the region [-1, 1].
 */
declare class Frustum extends Polyhedron {
	/**
	 * The planes bounding the frustum
	 */
	planes: Plane[];
	/**
	 * Creates a frustum for a given projection matrix.
	 * @param projection - The projection for which to create a frustum
	 */
	constructor(projection: Matrix4);
}

/**
 * Represents a 3D sphere, the collection of points within a given distance of a center.
 */
declare class Sphere extends Shape3D {
	/**
	 * The center of the sphere
	 */
	position: Vector3;
	/**
	 * The maximum distance from the center of the sphere to its bounds
	 */
	radius: number;
	/**
	 * Creates a new sphere.
	 * @param position - The center of the sphere
	 * @param radius - The radius of the sphere
	 */
	constructor(position: Vector3, radius: number);
	/**
	 * Returns a sphere which contains all of the given spheres.
	 * It is not guaranteed to be a newly allocated sphere, nor is it guaranteed to be the smallest possible bounding sphere.
	 * @param spheres - The bounding spheres to compose together. This must include at least one sphere
	 */
	static composeBoundingBalls(spheres: Sphere[]): Sphere;
}

/**
 * Represents an arbitrarily aligned circular cylinder.
 */
declare class Cylinder extends Shape3D {
	/**
	 * The position of the center of the cylinder
	 */
	position: Vector3;
	/**
	 * The unit vector pointing along the long axis of the cylinder
	 */
	axis: Vector3;
	/**
	 * The length of the long axis of the cylinder
	 */
	length: number;
	/**
	 * The radius of the cylinder
	 */
	radius: number;
	/**
	 * Creates a new cylinder.
	 * @param position - The position of the center of the new cylinder
	 * @param axis - The unit vector pointing along the long axis of the new cylinder
	 * @param length - The length of the long axis of the new cylinder
	 * @param radius - The radius of the new cylinder
	 */
	constructor(position: Vector3, axis: Vector3, length: number, radius: number);
	/**
	 * Returns a line segment from the center of one circular face to the other.
	 */
	get longAxis(): Line3D;
	/**
	 * Creates a new cylinder based on a line segment and a radius.
	 * @param longAxis - A line segment from the center of one circular face to the other
	 * @param radius - The radius of the cylinder
	 */
	static fromLongAxis(longAxis: Line3D, radius: number): void;
}

/**
 * Represents a node of the scene tree.
 * This is an abstract superclass and should not be constructed.
 */
declare class SceneElement {
	/**
	 * The parent node of this element
	 */
	container: this | null;
	/**
	 * The name of this element. This can be anything, but no two children of the same node may have the same name
	 */
	name: string;
	/**
	 * Whether or not this element has been removed from the scene. Changes to this variable will only remove the object at the end of the update cycle, so it is possible for this to be true while the element still exists. This variable is read-only
	 */
	removed: boolean;
	/**
	 * Whether this element is in the scene tree. This is only false if the object is not in the scene, and will still be true while the object is marked for removal but still present. This variable is read-only
	 */
	inScene: boolean;
	/**
	 * Removes the element from the parent element. This will take until the end of the update cycle to take effect.
	 */
	remove(): void;
}

/**
 * Represents an object in a Scene.
 * These can be created by the `.add...Element()` methods of ElementContainer.
 * Every scene object has a collection of local-space shapes that make up its presence.
 * These shapes are used for culling, rendering, and physics hitboxes.
 * Additionally, each scene object exists in N dimensions.
 * As such, within the documentation of this class, `Vector`, `Transform`, and `Shape` refer to the appropriate constructs for those dimensions.
 * This is an abstract superclass and should not be constructed.
 * 
 */
declare class SceneObject<Vector = any, Transform = any, Box = any, Shape = any> extends SceneElement {
	/**
	 * The location and orientation of the object in space
	 */
	transform: Transform;
	/**
	 * The location and orientation of the object last frame
	 */
	lastTransform: Transform;
	/**
	 * Whether or not mouse events (hover and click) should be checked for this object. This can be ignored if the scene has disabled mouse events
	 */
	mouseEvents: boolean;
	/**
	 * Whether or not the object should be rendered
	 */
	hidden: boolean;
	/**
	 * Whether or not the mouse cursor is hovering over the shapes of this object. This property is readonly, and won't be accurate if mouse events are disabled. This property is always false for 3D objects
	 */
	hovered: boolean;
	/**
	 * Whether or not the object passed the most recent render culling check
	 */
	onScreen: boolean;
	/**
	 * All of the ElementScripts on the object
	 */
	scripts: ScriptContainer;
	/**
	 * A reference to the shape with the name `"default"`
	 */
	defaultShape: Shape | null;
	/**
	 * The sorting layer for the object. Objects with higher sorting layers will be rendered after those with lower sorting layers
	 */
	layer: number;
	/**
	 * The amount of frames that the object has existed for
	 */
	lifeSpan: number;
	/**
	 * The renderer onto which the object will be drawn. This property is read-only
	 */
	renderer: Artist;
	/**
	 * Schedules a function to be called immediately after additions and removals from the scene take effect.
	 * It will be passed the object when called.
	 * @param fn - The function to be called
	 */
	sync(fn: (arg0: this) => void): void;
	/**
	 * Returns the World-Space bounding rectangle that contains the all the shapes of the object.
	 */
	getBoundingBox(): Box;
	/**
	 * Checks whether there is a shape on the object with a specific name.
	 * @param name - The name of the shape
	 */
	hasShape(name: string): boolean;
	/**
	 * Adds a new shape with a specified name.
	 * If a shape with that name already exists, it will be removed.
	 * @param name - The name corresponding to the new shape
	 * @param shape - The shape to add. The 3D shapes are only available for WorldObjects in 3D Mode
	 * @param convex - Whether the shape is known to be convex. Default is false
	 */
	addShape(name: string, shape: Shape, convex?: boolean): void;
	/**
	 * Removes a shape from the object with a specified name.
	 * If no shape exists with the given name, null is returned.
	 * Otherwise, the shape that is removed is returned in local-space.
	 * @param name - The name of the shape to remove
	 */
	removeShape(name: string): Shape | null;
	/**
	 * Returns all the shapes on the object, in local-space.
	 */
	getAllShapes(): Shape[];
	/**
	 * Returns a collection of convex shapes that take up the same region as the shapes of the object, in local-space.
	 */
	getAllConvexShapes(): Shape[];
	/**
	 * Returns all the shapes on the object, in World-Space.
	 */
	getAllModels(): Shape[];
	/**
	 * Returns a collection of convex shapes that take up the same region as the shapes of the object, in World-Space.
	 */
	getAllConvexModels(): Shape[];
	/**
	 * Adjusts the location of all of the object's shapes such that the geometric center of all the shapes is (0, 0) in local-space.
	 * @param stay - Whether the global-space position of the shapes be maintained by changing the object's transform. Default is false
	 */
	centerShapes(stay?: boolean): void;
	/**
	 * Removes all the shapes from the object, and returns them in local-space.
	 */
	removeAllShapes(): Shape[];
	/**
	 * Retrieves a specific shape in local-space based on its name.
	 * @param name - The name of the shape
	 */
	getShape(name: string): Shape;
	/**
	 * Returns a list of convex shapes in local-space that take up the same region as a specific shape.
	 * @param name - The name of the shape
	 */
	getConvexShapes(name: string): Shape[];
	/**
	 * Retrieves a specific shape in World-Space based on its name.
	 * @param name - The name of the shape
	 */
	getModel(name: string): Shape;
	/**
	 * Returns a list of convex shapes in World-Space that take up the same region as a specific shape.
	 * @param name - The name of the shape
	 */
	getConvexModels(name: string): Shape[];
	/**
	 * Uniformly scales the shapes of the object about its center.
	 * @param factor - The scale factor
	 */
	scale(factor: number): void;
	/**
	 * Returns whether a specific World-Space point is inside the shapes of the object.
	 * @param point - The point to check
	 */
	collidePoint(point: Vector): boolean;
	/**
	 * Hides the object.
	 */
	hide(): void;
	/**
	 * Shows the object. Un-does `.hide()`.
	 */
	show(): void;
}

/**
 * Scripts in the Hengine are subclasses of ElementScript.
 * These scripts represent collections of behavior for SceneObjects and data related to that behavior.
 * Extending scripts is not allowed.
 * The way the behavior of scripts is specified is via specifying optional listeners for a series of events, which fire at different times over the course of the associated object's lifetime.
 * All methods defined on a script are passed the associated sceneObject as an implicit parameter. This is also true of non-event-listener methods.
 * The available events to listen for, and when they're fired, are specified in the methods section. However, the signatures in the methods section leave out the initial object parameter, which is required for all methods of a script.
 * ```js
 * class ORBIT_AROUND extends ElementScript {
 * 	init(obj, center, radius) {
 * 		obj.scripts.removeDefault(); // remove normal drawing behavior
 * 		this.center = center;
 * 		this.radius = radius;
 * 		this.angle = 0;
 * 	}
 * 
 * 	getOrbitPosition(obj) {
 * 		return Vector2.fromAngle(this.angle)
 * 			.times(this.radius)
 * 			.plus(this.center);
 * 	}
 * 
 * 	update(obj) {
 * 		this.angle += 0.01;
 * 		obj.transform.position = this.getOrbitPosition(); // implicitly passes obj
 * 	}
 * 
 * 	draw(obj, name, shape) {
 * 		renderer.draw(new Color("red")).infer(shape);
 * 	}
 * }
 * 
 * const orbiter = scene.main.addCircleElement("orbiter", 0, 0, 30);
 * orbiter.scripts.add(ORBIT_AROUND, middle, 300);
 * ```
 * This is an abstract superclass and should not be constructed.
 */
declare class ElementScript {
	/**
	 * The object with the behavior
	 */
	sceneObject: SceneObject;
	/**
	 * When in the sorting order the handlers of this script should occur. Scripts with higher values for this property will have their handlers executed last
	 */
	scriptNumber: number;
	/**
	 * Checks if a certain listener is defined in the script.
	 * @param eventName - The name of the event to check for
	 */
	static implements(eventName: string): boolean;
	/**
	 * This is called when the script is added to the object.
	 * The non-initial arguments to `ScriptContainer.scripts.add()` are passed to this listener.
	 * The return value of this function will be returned from `ScriptContainer.scripts.add()`.
	 * @param args - The initialization arguments
	 */
	init(obj: SceneObject, ...args: any[]): any;
	/**
	 * This called each frame during the main update cycle.
	 */
	update(): void;
	/**
	 * This is called prior to rendering to determine whether an object should be rendered on a given camera.
	 * If this is not specified, the object will be rendered for all cameras.
	 * @param camera - The camera to test against
	 */
	drawRule(camera: Camera): boolean;
	/**
	 * This is called once per shape of the object each frame during rendering.
	 * When this is called, the renderer is in the local-space of the object.
	 * If the object is not on-screen or is hidden, this function will not be called.
	 * @param name - The name of the shape being rendered
	 * @param shape - The shape being rendered, in local-space
	 */
	draw(name: string, shape: Shape): void;
	/**
	 * This is called once per frame during rendering, immediately after the last call to `.draw()` for the object, regardless of whether the object is visible.
	 * When this called, the renderer is in World-Space.
	 */
	escapeDraw(): void;
	/**
	 * This is called when the script is removed from the object.
	 * This will also occur when the object is removed, and thus this is often more useful than the `.remove()` event.
	 */
	cleanUp(): void;
	/**
	 * This is called when the object is removed from the scene.
	 */
	remove(): void;
	/**
	 * This is called when this object is clicked with the mouse.
	 * This will never be called for 3D objects.
	 * @param key - The identifier of the button used to click
	 * @param point - The location of the mouse in world space
	 */
	click(key: string, point: Vector2): void;
	/**
	 * This is called when this object is initially hovered over by the mouse.
	 * This will never be called for 3D objects.
	 * @param point - The location of the mouse in world space
	 */
	hover(point: Vector2): void;
	/**
	 * This is called when this object stops being hovered over by the mouse.
	 * This will never be called for 3D objects.
	 * @param point - The location of the mouse in world space
	 */
	unhover(point: Vector2): void;
	/**
	 * This is called each frame before the screen is cleared.
	 */
	beforeUpdate(): void;
	/**
	 * This is called each frame after rendering.
	 */
	afterUpdate(): void;
	/**
	 * This is called immediately before the physics engine runs each frame.
	 */
	beforePhysics(): void;
	/**
	 * This is called immediately after the physics engine runs each frame.
	 */
	afterPhysics(): void;
	/**
	 * This is called for potential collisions between the object and another object.
	 * If every `.collideRule()` implementation on the objects returns true, it will be detected and potentially resolved.
	 * If the object doesn't have the PHYSICS script, then this won't be called.
	 * @param other - The object to check collisions with
	 */
	collideRule(other: SceneObject): boolean;
	/**
	 * This is called for potential collisions between the object and another object.
	 * If any `.triggerRule()` implementation returns true, then the collision will be detected but not resolved.
	 * If the object doesn't have the PHYSICS script, then this won't be called.
	 * @param other - The object to check collisions with
	 */
	triggerRule(other: SceneObject): boolean;
	/**
	 * These are called when a collision occurs with the object in a specified direction (or for any direction, for `.collideGeneral()`).
	 * If the SceneObject doesn't have the PHYSICS script, then this won't be called.
	 * The `...Front` and `...Back` variants won't be called in 2D Mode.
	 * @param collision - The collision that occurred
	 */
	collideGeneral(collision: CollisionData): void;
	/**
	 * These are called when a collision occurs with the object in a specified direction (or for any direction, for `.collideGeneral()`).
	 * If the SceneObject doesn't have the PHYSICS script, then this won't be called.
	 * The `...Front` and `...Back` variants won't be called in 2D Mode.
	 * @param collision - The collision that occurred
	 */
	collideLeft(collision: CollisionData): void;
	/**
	 * These are called when a collision occurs with the object in a specified direction (or for any direction, for `.collideGeneral()`).
	 * If the SceneObject doesn't have the PHYSICS script, then this won't be called.
	 * The `...Front` and `...Back` variants won't be called in 2D Mode.
	 * @param collision - The collision that occurred
	 */
	collideRight(collision: CollisionData): void;
	/**
	 * These are called when a collision occurs with the object in a specified direction (or for any direction, for `.collideGeneral()`).
	 * If the SceneObject doesn't have the PHYSICS script, then this won't be called.
	 * The `...Front` and `...Back` variants won't be called in 2D Mode.
	 * @param collision - The collision that occurred
	 */
	collideTop(collision: CollisionData): void;
	/**
	 * These are called when a collision occurs with the object in a specified direction (or for any direction, for `.collideGeneral()`).
	 * If the SceneObject doesn't have the PHYSICS script, then this won't be called.
	 * The `...Front` and `...Back` variants won't be called in 2D Mode.
	 * @param collision - The collision that occurred
	 */
	collideBottom(collision: CollisionData): void;
	/**
	 * These are called when a collision occurs with the object in a specified direction (or for any direction, for `.collideGeneral()`).
	 * If the SceneObject doesn't have the PHYSICS script, then this won't be called.
	 * The `...Front` and `...Back` variants won't be called in 2D Mode.
	 * @param collision - The collision that occurred
	 */
	collideFront(collision: CollisionData): void;
	/**
	 * These are called when a collision occurs with the object in a specified direction (or for any direction, for `.collideGeneral()`).
	 * If the SceneObject doesn't have the PHYSICS script, then this won't be called.
	 * The `...Front` and `...Back` variants won't be called in 2D Mode.
	 * @param collision - The collision that occurred
	 */
	collideBack(collision: CollisionData): void;
	/**
	 * This is called when a shape is added to the object.
	 * @param name - The name of the new shape
	 * @param shape - The new shape being added
	 */
	addShape(name: string, shape: Shape): void;
	/**
	 * This is called when a shape is removed from the object.
	 * @param name - The name of the shape being removed
	 * @param shape - The shape that was just removed
	 */
	removeShape(name: string, shape: Shape): void;
	/**
	 * This is called when a script (including this one) is added to the object.
	 * @param script - The script being added
	 * @param args - The initialization arguments for the script
	 */
	addScript<T extends ElementScript>(script: Class<T>, ...args: RemainingParams<T["init"]>): void;
}

/**
 * Represents the collection of behaviors on a SceneObject.
 * ```js
 * // create a script which holds an action
 * class ACTION extends ElementScript {
 * 	init(obj, action) {
 * 		this.action = action;
 * 	}
 * }
 * 
 * const object = scene.main.addElement("hello", 0, 0);
 * object.scripts.add(ACTION, () => {
 * 	console.log("Hello World!");
 * });
 * 
 * // call the function from the defined property
 * object.scripts(ACTION).action(); // Hello World!
 * ```
 */
declare type ScriptContainer = {
	/**
	 * The associated object
	 */
	sceneObject: SceneObject;
	/**
	 * Returns the highest `.scriptNumber` of all scripts in the container.
	 */
	get maxScriptNumber(): number;
	/**
	 * Returns the lowest `.scriptNumber` of all scripts in the container.
	 */
	get minScriptNumber(): number;
	/**
	 * Returns the default script (`Scene.defaultScript`) of the object's scene.
	 */
	get defaultScript(): Class<ElementScript>;
	/**
	 * Removes every script from the object.
	 */
	removeAllScripts(): void;
	/**
	 * Adds a new script to the object. Returns the result of the `.init()` listener.
	 * This also defines a property with the name of the script (e.g. `.MY_SCRIPT` for a script defined as `class MY_SCRIPT extends ElementScript { ... }`) containing the script instance.
	 * None of the listeners on this script will be called until the next frame.
	 * If an instance of the script was already on the object, it will be removed.
	 * @param script - The script to add
	 * @param args - The initialization arguments to pass to the `.init()` listener.
	 */
	add<T extends ElementScript>(script: Class<T>, ...args: RemainingParams<T["init"]>): ReturnType<T["init"]>;
	/**
	 * Removes the scene's default script from the object.
	 */
	removeDefault(): void;
	/**
	 * Removes a specific script from the object.
	 * This removal is synchronized, and will only take effect at the end of the frame.
	 * When the script is removed, the `.cleanUp()` listener is called.
	 * @param script - The class of the script instance to remove
	 */
	remove(script: Class<ElementScript>): void;
	/**
	 * Checks whether the object has a specific script.
	 * @param script - The script to check
	 */
	has(script: Class<ElementScript>): boolean;
	/**
	 * Checks whether the object has any scripts listening for a specific event.
	 * @param method - The name of the listener to check for
	 */
	implements(method: string): boolean;
	/**
	 * This function is called when the container is called as a function.
	 * It returns the instance of a given script, if present.
	 * @param script - The script to return the instance of
	 */
	<T extends ElementScript>(script: Class<T>): T;
}

/**
 * Represents a permanently Screen-Space object in a Scene.
 * All rendering for this class takes place in Screen-Space rather than World-Space, and should be targeted to `ui` rather than `renderer`.
 * Culling, point-collision checks, and other related operations will all use Screen-Space coordinates rather than World-Space.
 */
declare class UIObject extends SceneObject<Vector2, Transform2D, Rect, Circle | Polygon> {
	
}

/**
 * Represents an object in a Scene that exists in the space of the world.
 * The dimensionality of this object depends on whether the engine is in 2D or 3D mode.
 * Only objects of this type can have PHYSICS, or be rendered in the space of a Camera.
 */
declare class WorldObject extends SceneObject<VectorN, TransformN, BoxN, WorldObjectBallN | WorldObjectPolytopeN> {
	/**
	 * The World-Space bounding box to use for graphical culling instead of the shapes of the object. Starts as null
	 */
	graphicalBoundingBox: Prism | Rect | null;
	/**
	 * Whether or not the graphics should ever be culled. This can be ignored if the scene has disabled graphics culling. Starts as true
	 */
	cullGraphics: boolean;
}

/**
 * Makes a SceneObject draggable with the mouse.
 * If the object has PHYSICS, then it will become stationary while being dragged.
 * This forces the object to accept mouse events.
 * Only UIObjects can be made draggable in 3D Mode.
 * ```js
 * // create a draggable object with no bounds
 * const object = scene.main.addUIElement("box", width / 2, height / 2, 200, 100);
 * object.scripts.add(DRAGGABLE, "Left");
 * ```
 */
declare class DRAGGABLE extends ElementScript {
	/**
	 * The mouse button that can be used for dragging
	 */
	key: string;
	/**
	 * Whether the object is currently being dragged
	 */
	dragged: boolean;
	/**
	 * The bounds in which the object can be dragged
	 */
	bounds: Rect | null;
	/**
	 * Makes the object draggable with the mouse.
	 * @param key - The mouse button that can be used to drag the object
	 * @param bounds - The bounds in which the object can be dragged. Default is null
	 */
	init(obj: SceneObject, key: string, bounds?: Rect): void;
}

/**
 * Every instance of PARTICLE_SPAWNER has a `.Particle` member class with an identical structure.
 * This represents a single particle in a particle system.
 */
declare class Particle {
	/**
	 * The World-Space position of the particle
	 */
	position: Vector2;
	/**
	 * The velocity per frame of the particle
	 */
	velocity: Vector2;
	/**
	 * The proportion of the particle's lifespan that has elapsed. Setting this to 1 will remove the particle
	 */
	timer: number;
	/**
	 * This object is not used by the engine, and can be modified in any way to represent particle-specific data
	 */
	data: object;
	/**
	 * The particle system that created the particle
	 */
	spawner: PARTICLE_SPAWNER;
}

/**
 * This is an interface for the parameters to various property-setting methods on PARTICLE_SPAWNER.
 */
declare interface SpawnerProperties {
	/**
	 * Whether or not particles will have air resistance applied
	 */
	slows?: boolean;
	/**
	 * Whether or not particles will have gravity applied
	 */
	falls?: boolean;
	/**
	 * Whether or not particles will be spawned passively over time
	 */
	active?: boolean;
	/**
	 * The delay (in frames) between particle spawns. This can be less than 1
	 */
	delay?: number;
	/**
	 * The duration (in frames) of each particle's lifetime
	 */
	lifeSpan?: number;
	/**
	 * The effective radius of each particle used to compute culling. This does not affect the appearance of the particles
	 */
	radius?: number;
	/**
	 * This specifies how particles should be rendered. If this is FastFrame, they will be rendered on a separate surface and then be copied over. If this is CanvasImage, they will be rendered directly to the screen
	 */
	imageType?: Class<ImageType>;
	/**
	 * The function that is called to initialize particles.
	 * @param particle - The particle to initialize
	 */
	init?(particle: Particle): void;
	/**
	 * The function that is called to update particles each frame.
	 * Since this function is not culled, all non-rendering logic should be here.
	 * This property may instead be a String containing the source code for a GPUComputation that outputs a struct matching any inclusive subset of the structure of a Particle in the system. The source code also must include a `particles[]` uniform whose type is the same as the output of the computation. This uniform will reflect the state of the particles in the system.
	 * If this property is set to a String, it will add a computation to the particle system that operates on every particle each frame and prevents them from being updated in any other way.
	 * Setting this property to a function will remove the computation.
	 * @param particle - The particle being updated
	 */
	update?(particle: Particle): void;
	/**
	 * The function that is called to render particles each frame.
	 * This function should minimize side effects and, if possible, should be pure.
	 * @param renderer - The renderer to draw the particle to. Its transform will be in World-Space, unless the spawner is a UIObject
	 * @param particle - The particle to render
	 */
	draw?(renderer: Artist2D, particle: Particle): void;
}

/**
 * Adds particle emitting functionality to a SceneObject.
 * All properties of this class are read-only.
 * ```js
 * const particles = scene.main.addElement("particles", width / 2, height / 2);
 * particles.scripts.add(PARTICLE_SPAWNER, {
 * 	delay: 1,
 * 	lifeSpan: 100,
 * 	init(particle) {
 * 		particle.velocity = Vector2.fromAngle(Random.angle()).times(Random.range(2, 5));
 * 		particle.data.size = Random.range(2, 5);
 * 	},
 * 	draw(renderer, particle) {
 * 		renderer.draw(new Color("black")).circle(particle.position, particle.data.size);
 * 	}
 * });
 * ```
 */
declare class PARTICLE_SPAWNER extends ElementScript {
	/**
	 * The function that is called to initialize particles. This will be passed the particle object for each particle created. Default is a no-op
	 */
	particleInit: (arg0: Particle) => void;
	/**
	 * The function that is called to update particles each frame. This will be passed each particle object each frame. Since this function is not culled, all non-rendering logic should be here. This function will not run if the spawner has an active GPU computation. Default is a no-op.
	 */
	particleUpdate: (arg0: Particle) => void;
	/**
	 * The function that is called to render particles each frame. This will be passed an Artist and a particle object for each particle object on-screen each frame. Default is a no-op
	 */
	particleDraw: (arg0: Artist, arg1: Particle) => void;
	/**
	 * Whether or not particles will have air resistance applied. Default is false
	 */
	slows: boolean;
	/**
	 * Whether or not particles will have gravity applied. Default is false
	 */
	falls: boolean;
	/**
	 * Whether or not particles will be spawned passively over time. Default is true
	 */
	active: boolean;
	/**
	 * The delay (in frames) between particle spawns. This can be less than 1. Default is 1
	 */
	delay: number;
	/**
	 * The duration (in frames) of each particle's lifetime. Default is 100
	 */
	lifeSpan: number;
	/**
	 * The effective radius of each particle used to compute culling. This does not affect the appearance of the particles. Default is 10
	 */
	radius: number;
	/**
	 * Makes an object a particle system.
	 * @param properties - The settings to specify on the spawner. Those not specified will retain their default values
	 */
	init(obj: SceneObject, properties: SpawnerProperties): void;
	/**
	 * Sets the number of particles in the system.
	 * @param count - The new amount of particles
	 */
	set particleCount(count: number);
	/**
	 * Returns the current number of particles in the system.
	 */
	get particleCount(): number;
	/**
	 * Removes all of the particles from the system
	 */
	removeAllParticles(): void;
	/**
	 * Sets an inclusive subset of the properties of the system.
	 * @param properties - A collection of new setting values. Any settings not specified will be left as they were previously
	 */
	setProperties(properties: SpawnerProperties): void;
	/**
	 * Creates a collection of particles at once.
	 * @param count - The number of particles to create
	 * @param position - The location to create the particles at. Default is the location of the spawner
	 */
	explode(count: number, position?: Vector2): void;
	/**
	 * Returns the smallest axis-aligned World-Space rectangle that contains all of the particles in the system.
	 */
	getBoundingBox(): Rect;
}

/**
 * Adds rigidbody physics to a WorldObject.
 */
declare class PHYSICS extends ElementScript {
	/**
	 * The velocity of the object per frame
	 */
	velocity: VectorN;
	/**
	 * The angular velocity of the object in radians per frame
	 */
	angularVelocity: AngleN;
	/**
	 * Whether or not the object can move or rotate
	 */
	mobile: boolean;
	/**
	 * Whether or not the object should participate in the simulation at all
	 */
	simulated: boolean;
	/**
	 * Whether or not gravity should be applied to the object
	 */
	gravity: boolean;
	/**
	 * Whether or not air resistance should be applied to the object
	 */
	airResistance: boolean;
	/**
	 * Whether or not the object can rotate
	 */
	canRotate: boolean;
	/**
	 * The mass of the object. Setting this will change the density
	 */
	mass: number;
	/**
	 * The density of the object. Starts at 1
	 */
	density: number;
	/**
	 * The coefficient of friction for the object
	 */
	friction: number;
	/**
	 * The proportion of object's velocity lost in a collision
	 */
	snuzzlement: number;
	/**
	 * Whether the object can collide with any others
	 */
	canCollide: boolean;
	/**
	 * Whether the object should cancel all collision resolution, but not detection
	 */
	isTrigger: boolean;
	/**
	 * All of the objects currently colliding with the object
	 */
	colliding: CollisionMonitor;
	/**
	 * All of the objects that were colliding with the object last frame
	 */
	lastColliding: CollisionMonitor;
	/**
	 * Adds rigidbody physics to an object.
	 * @param mobile - Whether the object should be able to move/rotate
	 */
	init(obj: SceneObject, mobile: boolean): void;
	/**
	 * Retrieves a list of copies of all the constraints on the object.
	 */
	get constraints(): Constraint[];
	/**
	 * Retrieves the moment of inertia for the object.
	 */
	get inertia(): InertiaN;
	/**
	 * Applies an impulse to a specific point on the object.
	 * @param point - The World-Space point at which the impulse should be applied
	 * @param impulse - The impulse to apply
	 */
	applyImpulse(point: VectorN, impulse: VectorN): void;
	/**
	 * Applies an impulse to a specific point on the object.
	 * The impulse will be scaled by the mass of the object.
	 * @param point - The World-Space point at which the impulse should be applied
	 * @param impulse - The impulse to apply, which will be scaled
	 */
	applyImpulseMass(point: VectorN, impulse: VectorN): void;
	/**
	 * Stops the object in place. It remains mobile, though it loses all velocity.
	 */
	stop(): void;
	/**
	 * Checks whether the object and another given object would have a trigger collision if they collided.
	 * A trigger collision is not resolved, just detected.
	 * @param element - The object to check. Must have PHYSICS
	 */
	isTriggerWith(element: WorldObject): boolean;
	/**
	 * Checks whether the object and another given object could collide if they intersected.
	 * @param element - The object to check. Must have PHYSICS
	 */
	canCollideWith(element: WorldObject): boolean;
	/**
	 * Checks whether there are any constraints between the object and another given object
	 * @param other - The object to check. Must have PHYSICS
	 */
	constrainedTo(other: WorldObject): boolean;
}

/**
 * Makes a SceneObject into a text editor.
 * This only works on 2D SceneObjects, which includes only WorldObjects in 2D Mode.
 * Since the entire screen is a `<canvas>` in the Hengine, this serves as an alternative to `<textarea>`.
 * ```js
 * // single line text-box
 * const textbox = scene.main.addUIElement("textbox", width / 2, height / 2, 500, 50);
 * textbox.scripts.add(TEXT_AREA, Font.Arial40, false);
 * textbox.scripts.TEXT_AREA.alwaysIgnore("Enter");
 * 
 * intervals.continuous(() => {
 * 	if (keyboard.justPressed("Enter"))
 * 		console.log(textbox.scripts.TEXT_AREA.value);
 * });
 * ```
 */
declare class TEXT_AREA extends ElementScript {
	/**
	 * The current content of the text area. This value is read-only
	 */
	value: string;
	/**
	 * The initial index of the selected text
	 */
	selectionStart: number;
	/**
	 * The first index not in the selected text. If nothing is selected, this will be equal to `.selectionStart`
	 */
	selectionEnd: number;
	/**
	 * Whether the text area should allow new lines and scrolling
	 */
	multiline: boolean;
	/**
	 * Whether this is the currently focused text area
	 */
	focused: boolean;
	/**
	 * The font used to display the text area
	 */
	font: Font;
	/**
	 * The color of the caret. Starts as black
	 */
	caretColor: Color;
	/**
	 * The semi-transparent background color of selected text
	 */
	highlightColor: Color;
	/**
	 * The interior padding of the text area, measured as a proportion of the font size
	 */
	padding: number;
	/**
	 * The width of the scroll bars of a multiline text area
	 */
	scrollBarSize: number;
	/**
	 * The speed (in pixels per frame) of the scroll bars of a multiline text area
	 */
	scrollSpeed: number;
	/**
	 * The translation of the visible area of the text area due to scrolling
	 */
	scrollOffset: Vector2;
	/**
	 * Adds a text editor to a SceneObject.
	 * @param font - The font used for rendering the text
	 * @param paddingEM - The interior padding of the text area, measured as a proportion of the font size. Default is 0.5
	 * @param multiline - Whether the text area can have multiple lines and scrolling. Default is true
	 * @param renderText - A function used to render the text. The default renders the text in place with a black color
	 */
	init(obj: SceneObject, font: Font, paddingEM?: number, multiline?: boolean, renderText?: (arg0: string, arg1: Font, arg2: Vector2, arg3: (arg4: number) => Vector2, arg5: number) => void): void;
	/**
	 * Forces the text area to ignore a specific key input.
	 * @param key - The name of the key to ignore
	 */
	alwaysIgnore(key: string): void;
	/**
	 * Sets the content of the text area.
	 * @param value - The new content for the text area
	 */
	setValue(value: string): void;
	/**
	 * Forcibly focuses the text area.
	 */
	focus(): void;
	/**
	 * Forcibly un-focuses the text area, without focusing a different one.
	 */
	blur(): void;
}

/**
 * Represents a sequence of bytes, and allows writing and reading of various types to and from the buffer. 
 */
declare class ByteBuffer implements Copyable, Serializable {
	/**
	 * The writing API of the buffer
	 */
	write: ByteBuffer.Writer;
	/**
	 * The reading API of the buffer
	 */
	read: ByteBuffer.Reader;
	/**
	 * The measuring API of the buffer
	 */
	measure: ByteBuffer.Measurer;
	/**
	 * The offset into the buffer where reading and writing occur
	 */
	pointer: number;
	/**
	 * The endianness of the buffer
	 */
	littleEndian: boolean;
	/**
	 * The number of bytes in the buffer. This property is read-only
	 */
	byteLength: number;
	/**
	 * Creates a new ByteBuffer.
	 * @param bytes - The number of bytes (0 initialized) in the buffer. Default is 2
	 * @param pointer - The offset into the buffer where operations occur. Default is 0
	 * @param littleEndian - The endianness of the buffer. Default is true
	 */
	constructor(bytes?: number, pointer?: number, littleEndian?: boolean);
	/**
	 * Creates a new ByteBuffer.
	 * @param bytes - A buffer containing the bytes for the new buffer
	 * @param pointer - The offset into the buffer where operations occur. Default is 0
	 * @param littleEndian - The endianness of the buffer. Default is true
	 */
	constructor(bytes: ArrayBuffer, pointer?: number, littleEndian?: boolean);
	/**
	 * Advances the pointer by a specified amount.
	 * @param amount - The amount of bytes to increment by
	 */
	advance(amount: number): void;
	/**
	 * Resets the pointer to the beginning of the buffer and sets all the bytes in the buffer to 0.
	 */
	clear(): void;
	/**
	 * Trims the size of the buffer to only include up to (but not including) the current pointer.
	 */
	finalize(): void;
	/**
	 * Converts the buffer to a sequence of 16-bit unicode characters.
	 */
	toString(): string;
	/**
	 * Converts the buffer to a base-64 string.
	 */
	toBase64(): string;
	/**
	 * Converts a base-64 string to a new buffer.
	 * @param base64 - The base-64 string to convert
	 */
	static fromBase64(base64: string): ByteBuffer;
	/**
	 * Converts a series of 16-bit unicode characters into a new buffer.
	 * @param string - The string of data
	 */
	static fromString(string: string): ByteBuffer;
	/**
	 * Creates a copy of the object and optionally stores it in a provided destination.
	 * @param destination - The destination to copy the object into. This must be the same type as the caller
	 */
	get(destination?: this): this;
	/**
	 * Writes the object to a buffer and returns it.
	 * @param buffer - A destination buffer to write the result to. If not specified, a new buffer will be created
	 */
	toByteBuffer(buffer?: ByteBuffer): ByteBuffer;
	/**
	 * Creates an instance of the class based on data read from the current pointed-to location in a buffer. This increments the buffer's pointer to after the data of the instance.
	 * @param buffer - A source buffer to read the data from
	 */
	static fromByteBuffer(buffer: ByteBuffer): Serializable;
}

/**
 * Represents a sequence of bytes, and allows writing and reading of various types to and from the buffer. 
 */
declare namespace ByteBuffer {
	/**
	 * The writing API for a ByteBuffer.
	 * Every method of this class increments the associated buffer's pointer to after the written data.
	 */
	class Writer {
		/**
		 * Writes an S-bit integer to the buffer. S can be 8, 16, or 32.
		 * @param integer - The integer to write
		 */
		int8(integer: number): void;
		/**
		 * Writes an S-bit integer to the buffer. S can be 8, 16, or 32.
		 * @param integer - The integer to write
		 */
		int16(integer: number): void;
		/**
		 * Writes an S-bit integer to the buffer. S can be 8, 16, or 32.
		 * @param integer - The integer to write
		 */
		int32(integer: number): void;
		/**
		 * Reads an S-bit unsigned integer from the buffer. S can be 8, 16, or 32.
		 * @param integer - The unsigned integer to write
		 */
		uint8(integer: number): void;
		/**
		 * Reads an S-bit unsigned integer from the buffer. S can be 8, 16, or 32.
		 * @param integer - The unsigned integer to write
		 */
		uint16(integer: number): void;
		/**
		 * Reads an S-bit unsigned integer from the buffer. S can be 8, 16, or 32.
		 * @param integer - The unsigned integer to write
		 */
		uint32(integer: number): void;
		/**
		 * Reads an S-bit float from the buffer. S can be 32 or 64.
		 * @param float - The floating point value to write
		 */
		float32(float: number): void;
		/**
		 * Reads an S-bit float from the buffer. S can be 32 or 64.
		 * @param float - The floating point value to write
		 */
		float64(float: number): void;
		/**
		 * Writes a bigint to the buffer.
		 * @param bigint - The value to write
		 */
		bigInt(bigint: bigint): void;
		/**
		 * Writes a string to the buffer.
		 * @param string - The value to write
		 */
		string(string: string): void;
		/**
		 * Writes a boolean to the buffer.
		 * @param bool - The value to write
		 */
		bool(bool: boolean): void;
		/**
		 * Writes an array of values to the buffer.
		 * @param type - The name of another method of this class that can be used to write each element of the array
		 * @param data - The single-type array to write
		 */
		array(type: string, data: any[]): void;
		/**
		 * Writes a buffer to the buffer.
		 * @param buffer - The value to write to the buffer
		 */
		byteBuffer(buffer: ByteBuffer): void;
		/**
		 * Writes an arbitrary, potentially cyclic object to the buffer.
		 * This operation does not preserve the classes of the objects.
		 * @param object - The object to write
		 */
		object(object: object): void;
	}
	
	/**
	 * The measuring API for a ByteBuffer.
	 * This can be used to measure the length of a sequence of writes or reads.
	 */
	class Measurer {
		/**
		 * The number of bytes operated on since the last reset
		 */
		size: number;
		/**
		 * Resets the current size to 0.
		 */
		reset(): void;
	}
	
	/**
	 * The reading API for a Bytebuffer.
	 * Every method of this class increments the associated buffer's pointer to after the read data.
	 */
	class Reader {
		/**
		 * Reads an S-bit integer from the buffer. S can be 8, 16, or 32.
		 */
		int8(): number;
		/**
		 * Reads an S-bit integer from the buffer. S can be 8, 16, or 32.
		 */
		int16(): number;
		/**
		 * Reads an S-bit integer from the buffer. S can be 8, 16, or 32.
		 */
		int32(): number;
		/**
		 * Reads an S-bit unsigned integer from the buffer. S can be 8, 16, or 32.
		 */
		uint8(): number;
		/**
		 * Reads an S-bit unsigned integer from the buffer. S can be 8, 16, or 32.
		 */
		uint16(): number;
		/**
		 * Reads an S-bit unsigned integer from the buffer. S can be 8, 16, or 32.
		 */
		uint32(): number;
		/**
		 * Reads an S-bit float from the buffer. S can be 32 or 64.
		 */
		float32(): number;
		/**
		 * Reads an S-bit float from the buffer. S can be 32 or 64.
		 */
		float64(): number;
		/**
		 * Reads a bigint from the buffer.
		 */
		bigInt(): bigint;
		/**
		 * Reads a string from the buffer.
		 */
		string(): string;
		/**
		 * Reads a boolean from the buffer.
		 */
		bool(): boolean;
		/**
		 * Reads an array of values of a single type from the buffer.
		 * @param type - The name of another method of this class that can be used for reading each element
		 * @param count - If specified, this value will be used as the length of the array. This allows for reading sequences of values not prefixed with a length, but not those produced by `ByteBuffer.Writer.prototype.array()`
		 */
		array(type: string, count?: number): any[];
		/**
		 * Reads a buffer from the buffer
		 */
		byteBuffer(): ByteBuffer;
		/**
		 * Reads an object from the buffer.
		 */
		object(): object;
	}
}

/**
 * Classes implementing this interface can be written to and read back from a ByteBuffer with perfect fidelity.
 * This interface is used to ensure objects can be read from and written to the Files.
 */
declare interface Serializable {
	/**
	 * Writes the object to a buffer and returns it.
	 * @param buffer - A destination buffer to write the result to. If not specified, a new buffer will be created
	 */
	toByteBuffer(buffer?: ByteBuffer): ByteBuffer;
	/**
	 * Creates an instance of the class based on data read from the current pointed-to location in a buffer. This increments the buffer's pointer to after the data of the instance.
	 * @param buffer - A source buffer to read the data from
	 */
	static fromByteBuffer(buffer: ByteBuffer): Serializable;
}

/**
 * Provides an API for interacting with a key-based input device (mouse, keyboard).
 * This is an abstract superclass and should not be constructed.
 */
declare class InputHandler {
	/**
	 * Returns the current state of specific key.
	 * @param name - The name of the key to check
	 */
	get(name: string): InputHandler.State;
	/**
	 * Checks whether a key is in a specific state.
	 * @param name - The name of the key to check
	 */
	pressed(name: string): boolean;
	/**
	 * Checks whether a key is in a specific state.
	 * @param name - The name of the key to check
	 */
	released(name: string): boolean;
	/**
	 * Checks whether a key is in a specific state.
	 * @param name - The name of the key to check
	 */
	justPressed(name: string): boolean;
	/**
	 * Checks whether a key is in a specific state.
	 * @param name - The name of the key to check
	 */
	justReleased(name: string): boolean;
	/**
	 * Returns the specified timing statistic about a specific key.
	 * @param name - The name of the key to check
	 */
	pressLength(name: string): number;
	/**
	 * Returns the specified timing statistic about a specific key.
	 * @param name - The name of the key to check
	 */
	releaseLength(name: string): number;
	/**
	 * Returns the names of all keys that meet the specified requirement.
	 * If no keys meet the requirement, null is returned instead.
	 */
	get allPressed(): string[] | null;
	/**
	 * Returns the names of all keys that meet the specified requirement.
	 * If no keys meet the requirement, null is returned instead.
	 */
	get allJustPressed(): string[] | null;
	/**
	 * Returns the names of all keys that meet the specified requirement.
	 * If no keys meet the requirement, null is returned instead.
	 */
	get allJustReleased(): string[] | null;
}

/**
 * Provides an API for interacting with a key-based input device (mouse, keyboard).
 * This is an abstract superclass and should not be constructed.
 */
declare namespace InputHandler {
	/**
	 * Represents the current state of a key on an input device.
	 * This is an abstract superclass and should not be constructed.
	 * All properties of this class are read-only.
	 */
	class State {
		/**
		 * The handler associated with the input device.
		 */
		handler: InputHandler;
		/**
		 * The name of the associated key.
		 */
		name: string;
		/**
		 * Returns whether the key is currently pressed.
		 */
		get pressed(): boolean;
		/**
		 * Returns whether the key is not currently pressed.
		 */
		get released(): boolean;
		/**
		 * Returns whether the key became pressed within the last frame.
		 */
		get justPressed(): boolean;
		/**
		 * Returns whether the key stopped being pressed within the last frame.
		 */
		get justReleased(): boolean;
		/**
		 * Returns the duration of the most recent press of the key.
		 * If the key is currently pressed, this returns the time since the key was pressed.
		 */
		get pressLength(): number;
		/**
		 * Returns the duration of the most recent period in which the key was released.
		 * If the key is not currently pressed, this returns the time since the key was released.
		 */
		get releaseLength(): number;
	}
}

/**
 * Represents the API for interacting with the user's keyboard.
 * The names of letter keys should always be lowercase, and the names of special keys are same as the identifiers used for <a href="https://developer.mozilla.org/en-US/docs/Web/API/UI_Events/Keyboard_event_key_values">KeyboardEvent.key</a>.
 * This class is available via the `.keyboard` property of both the global object and Hengine.
 * ```js
 * intervals.continuous(() => { // change circle color based on whether the space bar is pressed
 * 	const color = keyboard.pressed(" ") ? new Color("red") : new Color("blue");
 * 	renderer.draw(color).circle(width / 2, height / 2, 50);
 * });
 * ```
 */
declare class KeyboardHandler extends InputHandler {
	/**
	 * A list of all the key presses that in the last frame. Unlike the normal key identifiers, these will include capital letters if a capital letter was typed, and the order will match the order in which the keys were pressed
	 */
	downQueue: string[];
}

/**
 * Represents the API for interacting with the user's mouse.
 * The names of keys for the mouse are Left, Middle, and Right, for the associated buttons.
 * This class is available via the `.mouse` property of both the global object and Hengine.
 * All properties of this class are read-only.
 * ```js
 * intervals.continuous(() => { // display a circle at the cursor position when pressing the left mouse button
 * 	if (mouse.pressed("Left"))
 * 		renderer.draw(new Color("red")).circle(mouse.screen, 10).
 * });
 * ```
 */
declare class MouseHandler extends InputHandler {
	/**
	 * The scroll displacement (in pixels) from the mouse wheel during the last frame.
	 */
	wheelDelta: number;
	/**
	 * The current cursor position, in Screen-Space
	 */
	screen: Vector2;
	/**
	 * The cursor position last frame, in Screen-Space
	 */
	screenLast: Vector2;
	/**
	 * The change in the cursor's Screen-Space position over the last frame
	 */
	screenDelta: Vector2;
	/**
	 * The current cursor position, in World-Space. This is only available in 2D Mode
	 */
	world: Vector2;
	/**
	 * The cursor position last frame, in World-Space.  This is only available in 2D Mode
	 */
	worldLast: Vector2;
	/**
	 * The change in the cursor's World-Space position over the last frame. This is only available in 2D Mode
	 */
	worldDelta: Vector2;
	/**
	 * Whether the mouse is currently locked and unable to move. This property is read-only
	 */
	locked: boolean;
	/**
	 * Locks the user's cursor in place and hides it.
	 * This can only be called after a user gesture.
	 * Changes in mouse position can still be read via the `.deltaScreen` and `.deltaWorld`.
	 */
	lock(): void;
	/**
	 * Unlocks the user's cursor.
	 * This can only be called after a successful call to `.lock()`.
	 */
	unlock(): void;
	/**
	 * Returns a location associated with a given key.
	 * @param name - The name of the key to check
	 */
	screenDragStart(name: string): Vector2;
	/**
	 * Returns a location associated with a given key.
	 * @param name - The name of the key to check
	 */
	screenDragEnd(name: string): Vector2;
	/**
	 * Returns a location associated with a given key.
	 * @param name - The name of the key to check
	 */
	worldDragStart(name: string): Vector2;
	/**
	 * Returns a location associated with a given key.
	 * @param name - The name of the key to check
	 */
	worldDragEnd(name: string): Vector2;
}

/**
 * Represents the API for interacting with the user's mouse.
 * The names of keys for the mouse are Left, Middle, and Right, for the associated buttons.
 * This class is available via the `.mouse` property of both the global object and Hengine.
 * All properties of this class are read-only.
 * ```js
 * intervals.continuous(() => { // display a circle at the cursor position when pressing the left mouse button
 * 	if (mouse.pressed("Left"))
 * 		renderer.draw(new Color("red")).circle(mouse.screen, 10).
 * });
 * ```
 */
declare namespace MouseHandler {
	/**
	 * The state of a given key on a mouse.
	 * All properties of this class are read-only.
	 */
	class State extends InputHandler.State {
		/**
		 * The beginning of the most recent click-and-drag motion with this key, in Screen-Space
		 */
		screenDragStart: Vector2;
		/**
		 * The end of the most recent click-and-drag motion with this key, in Screen-Space. If such a gesture is ongoing, this will be the current cursor position
		 */
		screenDragEnd: Vector2;
		/**
		 * The beginning of the most recent click-and-drag motion with this key, in World-Space
		 */
		worldDragStart: Vector2;
		/**
		 * The end of the most recent click-and-drag motion with this key, in World-Space. If such a gesture is ongoing, this will be the current cursor position
		 */
		worldDragEnd: Vector2;
	}
}

/**
 * Represents the API for interacting with the user's touch screen.
 * This class is available via the `.touches` property of both the global object and Hengine.
 * The names for keys in this API are arbitrary numbers, rather than Strings.
 * Getting these key names should be done with the `.allPressed`, `.allJustPressed`, and `.allJustReleased` getters, rather than specifying them directly.
 * All properties of this class are read-only.
 * ```js
 * intervals.continuous(() => {
 * 	const activeTouches = touches.allPressed;
 * 	if (activeTouches.length >= 2) {
 * 		// retrieve the positions of the first two touches
 * 		const a = touches.get(activeTouches[0]).screen;
 * 		const b = touches.get(activeTouches[1]).screen;
 * 		const dist = Vector2.dist(a, b);
 * 		
 * 		// shows the distance between the them
 * 		renderer.stroke(new Color("black"), 3).measure(
 * 			Font.Arial15, `Distance: ${Math.round(dist)} px`, a, b
 * 		);
 * 	}
 * });
 * ```
 */
declare class TouchHandler extends InputHandler {
	/**
	 * The maximum number of simultaneous touch points supported by the touch screen
	 */
	maxTouches: number;
	/**
	 * The number of currently active touches
	 */
	count: number;
	/**
	 * Returns the names of each touch meeting a specific requirement.
	 * If none meet the requirement, this returns null.
	 */
	get allPressed(): string[] | null;
	/**
	 * Returns the names of each touch meeting a specific requirement.
	 * If none meet the requirement, this returns null.
	 */
	get allJustPressed(): string[] | null;
	/**
	 * Returns the names of each touch meeting a specific requirement.
	 * If none meet the requirement, this returns null.
	 */
	get allJustReleased(): string[] | null;
}

/**
 * Represents the API for interacting with the user's touch screen.
 * This class is available via the `.touches` property of both the global object and Hengine.
 * The names for keys in this API are arbitrary numbers, rather than Strings.
 * Getting these key names should be done with the `.allPressed`, `.allJustPressed`, and `.allJustReleased` getters, rather than specifying them directly.
 * All properties of this class are read-only.
 * ```js
 * intervals.continuous(() => {
 * 	const activeTouches = touches.allPressed;
 * 	if (activeTouches.length >= 2) {
 * 		// retrieve the positions of the first two touches
 * 		const a = touches.get(activeTouches[0]).screen;
 * 		const b = touches.get(activeTouches[1]).screen;
 * 		const dist = Vector2.dist(a, b);
 * 		
 * 		// shows the distance between the them
 * 		renderer.stroke(new Color("black"), 3).measure(
 * 			Font.Arial15, `Distance: ${Math.round(dist)} px`, a, b
 * 		);
 * 	}
 * });
 * ```
 */
declare namespace TouchHandler {
	/**
	 * The state of a specific touch on the user's screen.
	 * All properties of this class are read-only.
	 */
	class State extends MouseHandler.State {
		/**
		 * The current position of the touch, in Screen-Space
		 */
		screen: Vector2;
		/**
		 * The position of the touch last frame, in Screen-Space
		 */
		screenLast: Vector2;
		/**
		 * The current position of the touch, in World-Space
		 */
		world: Vector2;
		/**
		 * The position of the touch last frame, in World-Space
		 */
		worldLast: Vector2;
	}
}

/**
 * Represents the API for interacting with the user's clipboard.
 * This class should not be constructed directly, and can be accessed from the `.clipboard` property of both the global object and Hengine.
 * ```js
 * intervals.continuous(() => {
 * 	if (mouse.justPressed("Middle")) { // copies a message when middle clicking
 * 		clipboard.write("Hello World!");
 * 	}
 * });
 * ```
 */
declare class ClipboardHandler {
	/**
	 * Writes a value to the clipboard.
	 * @param text - The text to write to the clipboard
	 */
	write(text: string): void;
	/**
	 * Writes a value to the clipboard.
	 * @param image - The image to write to the clipboard
	 */
	write(image: ImageType): void;
	/**
	 * Returns the text content of the clipboard.
	 * This value only updates after paste operations.
	 */
	read(): string;
}

/**
 * Represents a channel on which tones can be played.
 */
declare class SynthChannel {
	/**
	 * Stops the tone from playing, optionally after a delay.
	 * Returns a promise that resolves when the tone stops.
	 * @param wait - The interval (in milliseconds) to wait before stopping the sound. Default is 0
	 */
	stop(wait?: number): Promise;
}

/**
 * This is an interface for tone specifications.
 */
declare interface Tone {
	/**
	 * The duration (in milliseconds) of the tone. If not specified, the tone can be stopped at will
	 */
	duration?: number;
	/**
	 * The frequency of the tone in Hertz. If not specified, `.note` must be
	 */
	frequency?: number;
	/**
	 * The letter name of the the note, optionally with a "#" appended for sharp or a "b" for flat. If not specified, `.frequency` must be
	 */
	note?: string;
	/**
	 * Which octave on a piano the note would appear in. Default is 4. This is ignored if `.frequency` is specified
	 */
	octave?: number;
	/**
	 * The volume of the tone on [0, 1]. Default is 1
	 */
	volume?: number;
	/**
	 * The name of the waveform for the tone. This is one of (`"sine"`, `"sawtooth"`, `"triangle"`, `"square"`). Default is `"sine"`
	 */
	wave?: string;
}

/**
 * Represents a synthesizer which can create pure tones.
 * ```js
 * const synth = new Synth();
 * synth.playSequence([
 * 	{ frequency: 440, duration: 1000 }, // one second A note
 * 	{ duration: 500, volume: 0 } // half second pause
 * 	{ note: "A", duration: 1000 } // one second A note
 * ]);
 * ```
 */
declare class Synth {
	/**
	 * Creates a new Synth.
	 */
	constructor();
	/**
	 * Plays a tone. If the tone has a specified duration, this returns a promise that resolves when it completes. Otherwise, this returns the `.stop()` method of the SynthChannel playing this tone.
	 * @param tone - The specification of the tone to play.
	 */
	play(tone: Tone): ((arg0: number) => void) | Promise;
	/**
	 * Plays a sequence of tones with specified durations. Returns a promise that resolves when they have all completed.
	 * @param all - The specifications of the tones to play. See the class description
	 * @param globals - All the properties of this object will be used as defaults for the properties of tones specified in `all`. Default is `{ }`
	 */
	playSequence(all: Tone[], globals?: Tone): Promise<void>;
}

/**
 * Represents an ongoing playback of a Sound.
 */
declare class SoundInstance {
	/**
	 * The volume of the playback on [0, 1]
	 */
	volume: number;
	/**
	 * Returns the current time in milliseconds since playback began.
	 */
	get time(): number;
	/**
	 * Stops playback of the sound.
	 */
	stop(): void;
}

/**
 * Represents an external sound clip.
 * These should be loaded using HengineSoundResource and not constructed directly.
 */
declare class Sound {
	/**
	 * Whether or not the sound loops upon completion. This value is read-only
	 */
	loops: boolean;
	/**
	 * The length, in milliseconds, of the sound
	 */
	duration: number;
	/**
	 * Starts playback of the sound in a new instance, which is returned.
	 * Multiple sound instances can play at once.
	 * @param volume - The volume of the playback on [0, 1]
	 */
	play(volume: number): SoundInstance;
}

/**
 * Represents a serializable file system that can be modified with a command-line-like interface.
 * File paths in this system are similar to those used in Windows, except that they use a forward slash "/" separator, and the base drive is `h:` rather than `C:`.
 * Various file types can be specified, such that complex classes can be written to the file system and retrieved.
 * All built-in Serializable objects can be written to the file system, with their extensions being the lowercase version of their names (e.g. `.string` for String).
 * This class is primarily used in the `.fileSystem` property of both the global object and Hengine.
 * ```js
 * // the file type class
 * class Triple {
 * 	constructor(a, b, c) {
 * 		this.a = a;
 * 		this.b = b;
 * 		this.c = c;
 * 	}
 * 
 * 	toByteBuffer(buffer = new ByteBuffer()) {
 * 		buffer.write.float64(this.a);
 * 		buffer.write.float64(this.b);
 * 		buffer.write.float64(this.c);
 * 		return buffer;
 * 	}
 * 
 * 	static fromByteBuffer(buffer) {
 * 		return new Triple(
 * 			buffer.read.float64(),
 * 			buffer.read.float64(),
 * 			buffer.read.float64()
 * 		);
 * 	}
 * }
 * 
 * // register file type
 * fileSystem.createFileType(Triple);
 * 
 * const value = new Triple(10, 20, 30.5);
 * fileSystem.writeFile("h:/tripleFile.triple", value);
 * 
 * const readValue = fileSystem.readFile("h:/tripleFile.triple");
 * console.log(readValue); // Triple { a: 10, b: 20, c: 30.5 }
 * ```
 */
declare class Files {
	/**
	 * Creates a new Files.
	 */
	constructor();
	/**
	 * Returns the current active directory.
	 */
	get directory(): string;
	/**
	 * Registers a new file type.
	 * The instance method `.toByteBuffer()` will be invoked when the type is written to the file system, and the static method `.fromByteBuffer()` will be invoked when reading.
	 * @param type - The data type that can be written and read to and from the file system
	 * @param extensions - A list of file name extensions that will have this type applied. Default is the name of the type
	 */
	createFileType<T extends Serializable>(type: Class<T>, extensions?: string[]): void;
	/**
	 * Returns the names of all the files in the current directory.
	 * @param all - Whether or not files beginning with "." should be included. Default is false
	 */
	listFiles(all?: boolean): string[];
	/**
	 * Returns a human-readable file tree of the current directory.
	 */
	tree(): string;
	/**
	 * Checks whether or not a file exists.
	 * @param path - The file path to check
	 */
	fileExists(path: string): boolean;
	/**
	 * Checks whether or not a directory exists.
	 * @param path - The directory path to check
	 */
	directoryExists(path: string): boolean;
	/**
	 * Writes a file to a specified path.
	 * Returns whether the it succeeded.
	 * @param path - The file path to write to
	 * @param contents - The data to write to the file
	 * @param raw - Whether or not the contents parameter is a ByteBuffer to be written directly rather than being file-type-specific data to be converted. Default is false
	 */
	writeFile(path: string, contents: any, raw?: boolean): boolean;
	/**
	 * Deletes a file at a specified path.
	 * Returns whether it succeeded.
	 * @param path - The file path to delete
	 */
	deleteFile(path: string): boolean;
	/**
	 * Deletes a directory at a specified path.
	 * Returns whether it succeeded.
	 * @param path - The directory path to delete
	 */
	deleteDirectory(path: string): boolean;
	/**
	 * Creates a new directory at a specified path.
	 * Returns whether it succeeded.
	 * @param path - The path to create the directory at
	 */
	createDirectory(path: string): boolean;
	/**
	 * Reads a file from a specified path.
	 * Returns null if it fails.
	 * @param path - The file path to read
	 * @param raw - Whether the data should be returned as a ByteBuffer, or as a file-type-specific converted type. Default is false
	 */
	readFile(path: string, raw?: boolean): any | null;
	/**
	 * Creates a new file if it doesn't exist.
	 * Returns the content of the file.
	 * @param path - The file to write to
	 * @param create - The function used to initially create the file content
	 */
	createFile(path: string, create: () => any): any;
	/**
	 * Checks the file size of a specified file.
	 * @param path - The file path to check
	 */
	getFileSize(path: string): number;
	/**
	 * Changes the current directory.
	 * Returns whether it succeeded.
	 * @param path - The path of the new directory
	 */
	changeDirectory(path: string): boolean;
	/**
	 * Downloads a file onto the user's computer.
	 * Returns a promise which resolves when the download occurs.
	 * @param path - The file to download
	 */
	downloadFile(path: string): Promise;
	/**
	 * Lets the user upload a file from their computer to a specified location.
	 * Returns a promise which resolves when the file is uploaded.
	 * @param path - The destination path for the file
	 */
	uploadFile(path: string): Promise;
	/**
	 * Serializes the file system to a data string.
	 */
	toString(): string;
	/**
	 * Deserializes a file system from a data string.
	 * @param string - The data string to deserialize
	 */
	static fromString(string: string): Files;
}