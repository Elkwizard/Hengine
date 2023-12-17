#pragma once

#include <unordered_set>
#include <unordered_map>
#include <cmath>

#include "rigidbody.hpp"

class Coord {
	public:
		int x;
		int y;

		Coord(int _x, int _y) {
			x = _x;
			y = _y;
		}

		bool operator ==(const Coord& b) const {
			return x == b.x && y == b.y;
		}
};

template <>
class std::hash<Coord> {
	private:
		std::hash<int> hash { };

	public:
		size_t operator()(const Coord& coord) const {
			return hash(coord.x) ^ hash(coord.y);
		} 
};

class Grid {
	private:
		double cellSize, inverseCellSize;
		std::unordered_map<Coord, std::vector<RigidBody*>> cells;

	public:
		Grid(double _cellSize) {
			cellSize = _cellSize;
			inverseCellSize = 1.0 / cellSize;
		}

		void addBody(Coord c, RigidBody& body) {
			cells[c].push_back(&body);
		}

		std::vector<RigidBody*> query(RigidBody& body, RigidBody::Filter filter) {
			std::vector<RigidBody*> bodies { };
			std::unordered_set<RigidBody*> found { };

			found.insert(&body);

			auto [x, y] = body.position;
			double radius = body.boundingRadius;

			int startX = getCell(x - radius);
			int startY = getCell(y - radius);

			int endX = getCell(x + radius);
			int endY = getCell(y + radius);

			for (int i = startX; i <= endX; i++)
			for (int j = startY; j <= endY; j++) {
				Coord c = { i, j };
				if (!cells.count(c)) continue;

				std::vector<RigidBody*>& cellBodies = cells.at(c);

				for (RigidBody* b : cellBodies)
					if (!found.count(b)) {
						found.insert(b);
						if (filter(*b)) bodies.push_back(b);
					}
			}

			return bodies;
		}
		
		int getCell(double value) const {
			return floor(value * inverseCellSize);
		}
		
		void cellsBounds(RigidBody& body) {
			auto [x, y] = body.position;
			int radius = body.boundingRadius;

			int startX = getCell(x - radius);
			int startY = getCell(y - radius);

			int endX = getCell(x + radius);
			int endY = getCell(y + radius);

			for (int i = startX; i <= endX; i++)
			for (int j = startY; j <= endY; j++)
				addBody({ i, j }, body);
		}
};
