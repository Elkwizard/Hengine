class TileMap {
	constructor(image, sections) {
		this.image = image;
		this.tiles = new Map();
		for (let i = 0; i < sections.length; i++) {
			const { name, area } = sections[i];
			this.tiles.set(name, Frame.fromImageType(image, area));
		}
	}
	get(tileType) {
		return this.tiles.get(tileType);
	}
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