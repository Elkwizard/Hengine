#pragma once

#include "RigidBody.hpp"
#include "../../Math/Coord.hpp"

#include <concepts>
#include <vector>
#include <unordered_set>
#include <unordered_map>

class SpatialHash {
	private:
		static constexpr int CELLS_PER_ITEM = raiseTo(2, DIM);
		std::unordered_map<Coord, std::vector<RigidBody::Collider*>> cells;
		double cellSize;
		double dt;
		size_t wave;

		AABB boundsOf(const RigidBody::Collider& collider) const {
			RigidBody* body = collider.body;
			return collider.localBounds + (body->position.linear + body->velocity.linear * dt);
		}
		
		static bool canCollide(const RigidBody::Collider& a, const RigidBody::Collider& b) {
			return a.body->canCollideWith(*b.body) && b.body->canCollideWith(*a.body);
		}

	public:
		SpatialHash() { }

		void build(const std::vector<RigidBody*>& container, double _dt) {
			dt = _dt;
			cells.clear();
			wave = 0;

			double total = 0;
			for (RigidBody* body : container) {
				double volume = body->matter.mass / body->getDensity();
				if (!isnan(volume)) total += volume;
			}

			size_t cellCount = container.size() * CELLS_PER_ITEM;
			cellSize = std::pow(total / cellCount, 1.0 / DIM);

			for (RigidBody* body : container) {
				if (!body->canCollide) continue;

				for (RigidBody::Collider& collider : body->colliders) {
					collider.wave = 0;
					AABB bounds = boundsOf(collider);
					Coord min (bounds.min / cellSize);
					Coord max (bounds.max / cellSize);
					ND_LOOP(cell, min, max) {
						cells[cell].push_back(&collider);
					}
				}
			}
		}

		std::vector<RigidBody::Collider*> query(const RigidBody::Collider& collider) {
			wave++;
			std::vector<RigidBody::Collider*> result;
			
			AABB bounds = boundsOf(collider);
			Coord min (bounds.min / cellSize);
			Coord max (bounds.max / cellSize);
			ND_LOOP(cell, min, max) {
				for (RigidBody::Collider* contained : cells[cell]) {
					if (contained->wave < wave) {
						contained->wave = wave;
						if (canCollide(collider, *contained))
							result.push_back(contained);
					}
				}
			}

			return result;
		}
};