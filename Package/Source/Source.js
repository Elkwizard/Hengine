//put setup code here:
g.preservePixelart = true;
let tex = new Texture(100, 100);
for (let [x, y] of tex) {
	tex.setPixel(x, y, Color.quadLerp(cl.RED, cl.LIME, cl.BLUE, cl.BLANK, x / tex.width, y / tex.height));
}
tex.updateImageData();
g.update = () => {
	//this gets run every frame
	c.drawTexture(tex, 0, 0, 200, 200);	
}