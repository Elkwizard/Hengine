#pragma once

#include "RigidBody.hpp"
#include "../Math/Coord.hpp"

#include <concepts>
#include <vector>
#include <unordered_set>
#include <unordered_map>

class SpatialHash {
	private:
		static constexpr int CELLS_PER_ITEM = raiseTo(2, DIM);
		std::unordered_map<Coord, std::vector<RigidBody*>> cells;
		double cellSize;
		double dt;
		size_t wave;

		AABB boundsOf(RigidBody* body) const {
			return body->bounds + body->velocity.linear * dt;
		}
		
		static bool canCollide(const RigidBody& a, const RigidBody& b) {
			return a.canCollideWith(b) && b.canCollideWith(a);
		}

	public:
		SpatialHash() { }

		void build(const std::vector<RigidBody*>& container, double _dt) {
			dt = _dt;
			cells.clear();
			wave = 0;

			double total = 0;
			for (RigidBody* body : container) {
				double volume = body->bounds.volume();
				if (!isnan(volume)) total += volume;
			}

			size_t cellCount = container.size() * CELLS_PER_ITEM;
			cellSize = std::pow(total / cellCount, 1.0 / DIM);

			for (RigidBody* body : container) {
				if (!body->canCollide) continue;

				body->wave = 0;

				AABB bounds = boundsOf(body);
				Coord min (bounds.min / cellSize);
				Coord max (bounds.max / cellSize);
				ND_LOOP(cell, min, max) {
					cells[cell].push_back(body);
				}
			}
		}

		std::vector<RigidBody*> query(RigidBody* body) {
			wave++;
			std::vector<RigidBody*> result;
			
			AABB bounds = boundsOf(body);
			Coord min (bounds.min / cellSize);
			Coord max (bounds.max / cellSize);
			ND_LOOP(cell, min, max) {
				for (RigidBody* contained : cells[cell]) {
					if (contained->wave < wave) {
						contained->wave = wave;
						if (canCollide(*body, *contained))
							result.push_back(contained);
					}
				}
			}

			return result;
		}
};