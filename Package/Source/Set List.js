const WALLS = new InactiveScene("Walls");
WALLS.addRectElement("Ceiling", 0, -100, width, 100, false, false, "Wall");
WALLS.addRectElement("Floor", 0, height, width, 100, false, false, "Wall");
WALLS.addRectElement("Right Wall", -100, -100, 100, height + 200, false, false, "Wall");
WALLS.addRectElement("Left Wall", width, -100, 100, height + 200, false, false, "Wall");