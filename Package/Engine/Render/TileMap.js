/**
 * Represents a collection of sprites contained within a single image.
 * ```js
 * const spriteSheet = loadResource("sprites.png"); // 32 x 32
 * const tileMap = TileMap.regular(spriteSheet, 16, 16, ["cat", "dog", "fish", "creature"]); // extract 4 tiles
 * 
 * renderer.image(tileMap.get("fish")).rect(0, 0, 64, 64);
 * ```
 */
class TileMap {
	/**
	 * Creates a new TileMap.
	 * @param ImageType image | The overall sprite sheet
	 * @param Object[] sections | The regions of the sprite sheet assigned to each sprite. Each entry in this list has a `.name` property, which is any unique identifier for the sprite, and a `.area` property, which is a Rect representing the natural region of the sprite sheet assigned to this name
	 */
	constructor(image, sections) {
		this.image = image;
		this.tiles = new Map();
		for (let i = 0; i < sections.length; i++) {
			const { name, area } = sections[i];
			this.tiles.set(name, Frame.fromImageType(image, area));
		}
	}
	/**
	 * Retrieves a specific sprite from the sprite sheet.
	 * @param Any name | The identifier of a specific sprite
	 * @return ImageType
	 */
	get(tileType) {
		return this.tiles.get(tileType);
	}
	/**
	 * Creates a tile map based on a series of contiguous, fixed-size, left-to-right, top-to-bottom tiles.
	 * @param ImageType image | The sprite sheet
	 * @param Number tileWidth | The width of each tile
	 * @param Number tileHeight | The height of each tile
	 * @param Any[] names | The list of identifiers for each tile
	 * @return TileMap
	 */
	static regular(image, tileWidth, tileHeight, names) {
		let x = 0;
		let y = 0;
		const sections = [];
		for (let i = 0; i < names.length; i++) {
			sections.push({ name: names[i], area: new Rect(x, y, tileWidth, tileHeight) });
			x += tileWidth;
			if (x >= image.width) {
				x = 0;
				y += tileHeight;
			}
		}

		return new TileMap(image, sections);
	}
}