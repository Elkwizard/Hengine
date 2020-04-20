//put setup code here:
const floor = s.addPhysicsRectElement("floor", width / 2, height, width, 100, false);
const rect = s.addPhysicsRectElement("rect", width / 2, height / 2, 40, 40, true);
const circle = s.addPhysicsCircleElement("circle", width / 2, height / 2, 20, true);
const rect2 = s.addPhysicsRectElement("rect", width / 2 - 5, height / 2, 40, 40, true);
const circle2 = s.addPhysicsCircleElement("circle", width / 2 + 1, height / 2, 20, true);
g.update = () => {
	//this gets run every frame
	
}
PLAYER_MOVEMENT.addTo(rect);