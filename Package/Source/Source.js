//put setup code here:
let colors = [cl.RED, cl.YELLOW, cl.GREEN, cl.BLUE, cl.PURPLE];
function count(node) {
	let n = node.nodes.length;
	for (let nd of node.nodes) n += count(nd);
	return n;
}
function render(node, x, y, w, d, arrows) {
	let m_w = w / node.nodes.length;
	let total = 0;
	for (let nd of node.nodes) total += count(nd);
	for (let i = 0; i < node.nodes.length; i++) {
		let a_x = x + m_w * (i - (node.nodes.length - 1) / 2);
		let a_y = 100 + y;
		let a_w = w * count(node.nodes[i]) / total;
		render(node.nodes[i], a_x, a_y, a_w, d + 1, arrows);
		if (arrows) c.stroke(cl.BLACK, 3).line(x, y, a_x, a_y);
	}
	if (!arrows) {
		c.draw(cl.WHITE).circle(x, y, 1 / d * 20);
		c.stroke(cl.BLACK, 2).circle(x, y, 1 / d * 20);
		// if (node.value.type) {
		// 	let img = loadImage(node.value.type.toUpperCase() + ".png");
		// 	c.image(img).circle(x, y, 1 / d * 20);
		// }
	}
}
M.onMove.listen(e => {
	if (M.down) {
		let m = s.screenSpaceToWorldSpace(M);
		let mLast = s.screenSpaceToWorldSpace(M.last);
		let dif = Vector2.fromPoint(m).minus(mLast);
		s.display.x -= dif.x;
		s.display.y -= dif.y;
	}
});
g.update = () => {
	//this gets run every frame
	s.drawInWorldSpace(e => {
		render(documentation, width / 2, 100, width * 5, 0, true);
		render(documentation, width / 2, 100, width * 5, 0, false);
	});
}
M.onScroll.listen(e => (e < 0) ? s.zoomIn(.2) : s.zoomOut(.2));