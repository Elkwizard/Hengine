const WALLS = new InactiveScene("Walls");
WALLS.addPhysicsRectElement("Ceiling", width / 2, -50, width, 100, false, false, "Wall");
WALLS.addPhysicsRectElement("Floor", width / 2, height + 50, width, 100, false, false, "Wall");
WALLS.addPhysicsRectElement("Right Wall", width + 50, height / 2, 100, height + 200, false, false, "Wall");
WALLS.addPhysicsRectElement("Left Wall", -50, height / 2, 100, height + 200, false, false, "Wall");