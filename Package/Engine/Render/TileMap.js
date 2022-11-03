class TileMap {
	constructor(image, sections) {
		this.image = image;
		this.tiles = new Map();
		const img = image.makeImage();
		for (let i = 0; i < sections.length; i++) {
			const { name, x, y, width, height } = sections[i];
			const frame = new Frame(width, height, 1);
			frame.renderer.c.drawImage(img, x, y, width, height, 0, 0, width, height);
			this.tiles.set(name, frame);
		}
	}
	getTile(tileType) {
		return this.tiles.get(tileType);
	}
}