//put setup code here:
const IMG = {
	tl: loadImage("TL.png"),
	cs: loadImage("CS.png"),
	pr: loadImage("PR.png"),
	fn: loadImage("FN.png")
};
g.preservePixelart = true;
let colors = [cl.RED, cl.YELLOW, cl.GREEN, cl.BLUE, cl.PURPLE];
function count(node) {
	let n = node.nodes.length;
	for (let nd of node.nodes) n += count(nd);
	return n;
}
function render(node, x, y, w, d, arrows) {
	let m_w = w / node.nodes.length;
	for (let i = 0; i < node.nodes.length; i++) {
		let a_x = x + m_w * (i - (node.nodes.length - 1) / 2);
		let a_y = 100 + y;
		render(node.nodes[i], a_x, a_y, m_w, d + 1, arrows);
		if (arrows) c.stroke(cl.RED, 3).line(x, y, a_x, a_y);
	}
	if (!arrows) {
		c.draw(cl.BLACK).circle(x, y, 1 / d * 20 + 2);
		if (node.value && node.value.type) {
			let m = s.screenSpaceToWorldSpace(M);
			let dist = (m.x - x) ** 2 + (m.y - y) ** 2;
			if (dist < 30 ** 2) {
				let name = node.value.name;
				c.stroke(cl.RED, 2).circle(x, y, 30);
				c.draw(cl.ORANGE).text("40px Arial", name, x, y);
			}
		}
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
	console.log(p);
	s.drawInWorldSpace(e => {
		render(documentation, width / 2, 100, width * 5, 0, true);
		render(documentation, width / 2, 100, width * 5, 0, false);
	});
}
M.onScroll.listen(e => (e < 0) ? s.zoomIn(.2) : s.zoomOut(.2));