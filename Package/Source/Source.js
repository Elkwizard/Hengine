//put setup code here:
g.hasFixedPhysicsUpdateCycle = false;
let block = s.addPhysicsRectElement("block", width / 2, height / 2, 50, 50, true);
for (let i = 0; i < 100; i++) s.addPhysicsRectElement("block", width / 2 + 80, height / 2 - i * 100, 50, 50, true);
PLAYER_MOVEMENT.addTo(block);
let floor = s.addPhysicsRectElement("floor", width / 2, height, width, 400, false);
g.update = () => {
	//this gets run every frame
	
}
M.onScroll.listen(e => (e < 0) ? s.zoomIn(.2) : s.zoomOut(.2));