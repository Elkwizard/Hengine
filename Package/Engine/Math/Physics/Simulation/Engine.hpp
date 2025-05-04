#pragma once

#include <algorithm>

#include "Detector.hpp"
#include "Resolver.hpp"
#include "SpatialHash.hpp"
#include "Constraint/ContactConstraint.hpp"
#include "Constraint/Constraint2.hpp"

API_IMPORT void onCollide(const RigidBody&, const RigidBody&, const Vector&, const std::vector<Vector>&, bool, bool);

class Engine;

API class Engine {
	private:
		using CollisionPair = std::pair<RigidBody*, std::vector<RigidBody*>>;
		
		std::vector<std::unique_ptr<RigidBody>> bodies;
		std::vector<RigidBody*> simBodies;
		std::vector<RigidBody*> dynBodies;
		std::vector<std::unique_ptr<ContactConstraint>> contacts;
		std::vector<std::unique_ptr<Constraint2>> constraints;
		std::unordered_set<std::pair<RigidBody*, RigidBody*>> collisions;
		SpatialHash hash;

		void cacheBodies() {
			dynBodies.clear();
			simBodies.clear();
			for (const auto& body : bodies) {
				if (!body->simulated) continue;
				body->sync();
				body->cache();
				simBodies.push_back(body.get());
				if (body->dynamic)
					dynBodies.push_back(body.get());
			}
		}

		void applyForces(double dt) {
			double dragFactor = std::pow(1.0 - drag, dt);
			Vector scaledGravity = gravity * dt;
			for (RigidBody* body : dynBodies) {
				if (body->gravity) body->velocity.linear += scaledGravity;
				if (body->drag) body->velocity *= dragFactor;
			}
		}
		
		void integrate(double dt) {
			for (RigidBody* body : dynBodies)
				body->integrate(dt);
		}

		void clearProhibited() {
			for (RigidBody* body : dynBodies)
				body->prohibited.clear();
		}

		void collide(const std::vector<CollisionPair>& pairs) {
			for (const auto& [body, toCollide] : pairs)
				for (RigidBody* other : toCollide)
					tryCollide(*body, *other);
		}

		void tryCollide(RigidBody& a, RigidBody& b) {
			if (&a == &b) return;

			std::optional<Collision> col = Detector::collideBodies(a, b);
			
			if (!col || triggerCollision(&a, &b, *col)) return;

			col->dynamic = b.dynamic && !b.prohibited.has(col->normal);
			if (!col->dynamic)
				a.prohibited.add(col->normal);

			ContactConstraint* constraint = new ContactConstraint(a, b, *col);
			constraint->solvePosition();
			contacts.emplace_back(constraint);
		}

		bool triggerCollision(RigidBody* a, RigidBody* b, const Collision& col) {
			auto collisionKey = a < b ? std::make_pair(a, b) : std::make_pair(b, a);

			bool isTriggerA = a->isTriggerWith(*b);
			bool isTriggerB = b->isTriggerWith(*a);

			if (!collisions.count(collisionKey)) {
				collisions.insert(collisionKey);
				onCollide(*a, *b, col.normal, col.contacts, isTriggerA, isTriggerB);
			}

			return isTriggerA || isTriggerB;
		}

		std::vector<CollisionPair> getCollisionPairs(double dt) {
			std::sort(dynBodies.begin(), dynBodies.end(), [this](RigidBody* a, RigidBody* b) {
				return dot(b->position.linear - a->position.linear, gravity) < 0; 
			});
			hash.build(simBodies, dt);
			std::vector<CollisionPair> collisionPairs;
			for (RigidBody* body : dynBodies) {
				if (body->canCollide)
					collisionPairs.emplace_back(body, hash.query(body));
			}

			return collisionPairs;
		}

	public:
		API Vector gravity;
		API double drag = 0.005;
		API int constraintIterations = 4;
		API int contactIterations = 4;
		API int iterations = 10;

		API Engine() { }

		API void addBody(RigidBody* body) {
			bodies.emplace_back(body);
		}

		API std::vector<Constraint2*> getBodyConstraints(RigidBody* body) const {
			std::vector<Constraint2*> result;
			for (const auto& constraint : constraints)
				if (constraint->hasBody(*body))
					result.push_back(constraint.get());
			return result;
		}

		API void removeBody(RigidBody* body) {
			for (Constraint2* constraint : getBodyConstraints(body))
				removeConstraint(constraint);
			erase(bodies, body);
		}

		API std::vector<RigidBody*> getBodies() const {
			std::vector<RigidBody*> result;
			for (const auto& body : bodies)
				result.push_back(body.get());
			return result;
		}

		API void addConstraint(Constraint2* constraint) {
			constraints.emplace_back(constraint);
			constraint->add();
		}

		API void removeConstraint(Constraint2* constraint) {
			constraint->remove();
			erase(constraints, constraint);
		}

		API std::vector<Constraint2*> getConstraints() const {
			std::vector<Constraint2*> result;
			for (const auto& constraint : constraints)
				result.push_back(constraint.get());
			return result;
		}

		API void run(double deltaTime) {
			cacheBodies();

			collisions.clear();
			
			std::vector<CollisionPair> collisionPairs = getCollisionPairs(deltaTime);

			double subDeltaTime = deltaTime / iterations;
			for (int i = 0; i < iterations; i++) {
				integrate(subDeltaTime);
				applyForces(subDeltaTime);

				{ // resolve position
					clearProhibited();
					Resolver<Constraint2, &Constraint2::solvePosition> resolver;
					for (const auto& item : constraints)
						resolver.addConstraint(item.get());
					resolver.solve(constraintIterations);
					collide(getCollisionPairs(0));
				}

				{ // resolve velocity
					Resolver<Constraint, &Constraint::solve> resolver;
					for (const auto& item : constraints)
						resolver.addConstraint(item.get());
					for (const auto& item : contacts)
						resolver.addConstraint(item.get());
					resolver.solve(contactIterations);
					contacts.clear();
				}
			}
		}

		RayHit raycast(const Ray& ray) const {
			RayHit best;

			for (const auto& body : bodies)
				best.add(body->raycast(ray));

			return best;
		}
};