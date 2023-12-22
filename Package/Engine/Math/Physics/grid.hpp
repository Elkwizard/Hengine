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
	public:
		size_t operator()(const Coord& c) const {
			return (1478611 * c.x) ^ (8689987 * c.y);
		}
};

class Grid {
	private:
		double cellSize, inverseCellSize;
		std::unordered_map<Coord, Bodies> cells;

	public:
		Grid(double _cellSize) {
			cellSize = _cellSize;
			inverseCellSize = 1.0 / cellSize;
		}

		void addBody(const Coord& c, RigidBody& body) {
			cells[c].push_back(&body);
		}

		Bodies query(RigidBody& body, const RigidBody::Filter& filter) {
			Bodies bodies { };
			std::unordered_set<RigidBody*> found { };

			found.insert(&body);

			for (int i = body.bounds.minX; i <= body.bounds.maxX; i++)
			for (int j = body.bounds.minY; j <= body.bounds.maxY; j++) {
				Coord c = { i, j };
				if (!cells.count(c)) continue;

				Bodies& cellBodies = cells.at(c);

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

			body.bounds = {
				getCell(x - radius), getCell(y - radius),
				getCell(x + radius), getCell(y + radius)
			};

			for (int i = body.bounds.minX; i <= body.bounds.maxX; i++)
			for (int j = body.bounds.minY; j <= body.bounds.maxY; j++)
				addBody({ i, j }, body);
		}
};
