#pragma once

#include <algorithm>

#include "Detector.hpp"
#include "Resolver.hpp"
#include "SpatialHash.hpp"
#include "Constraint/ContactConstraint.hpp"
#include "ConstraintDescriptor.hpp"

API_IMPORT void onCollide(const RigidBody&, const RigidBody&, const Vector&, const std::vector<Vector>&, bool, bool);

class Engine;

API class Engine {
	private:
		using CollisionPair = std::pair<RigidBody*, std::vector<RigidBody*>>;

		static constexpr double CONSTRAINT_IMPROVEMENT_THRESHOLD = 0.1;
		static constexpr int CONSTRAINT_CONFUSION_THRESHOLD = 4;
		static constexpr int CONSTRAINT_BATCH_SIZE = 30;
		static constexpr int CONSTRAINT_ITERATIONS_THRESHOLD = 100;
		static constexpr double CONSTRAINT_ERROR_THRESHOLD = 1.0;
		
		std::vector<std::unique_ptr<RigidBody>> bodies;
		std::vector<RigidBody*> simBodies, dynBodies;
		std::vector<std::unique_ptr<ConstraintDescriptor>> constraintDescriptors;
		std::unordered_map<std::pair<RigidBody*, RigidBody*>, bool> triggerCache;
		SpatialHash hash;

		void cacheBodies() {
			dynBodies.clear();
			simBodies.clear();
			for (const auto& body : bodies) {
				if (!body->simulated) continue;
				body->cache();
				simBodies.push_back(body.get());
				if (body->getDynamic())
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

		void sortBodies(bool highToLow) {
			std::sort(dynBodies.begin(), dynBodies.end(), [=, this](RigidBody* a, RigidBody* b) {
				double diff = dot(b->position.linear - a->position.linear, gravity);
				return highToLow ? diff > 0 : diff < 0;
			});
		}
		
		Constraint2* tryConstraint(RigidBody& body, ConstraintDescriptor& desc) {
			bool swap = &desc.b.body == &body;
			Constrained& a = swap ? desc.b : desc.a;
			Constrained& b = swap ? desc.a : desc.b;

			if (a.isStatic) return nullptr;

			return desc.makeConstraint(b.isDynamic(), a, b);
		}

		void exploreIsland(RigidBody* body, int island, std::unordered_map<RigidBody*, int>& map) {
			if (map.count(body)) return;

			map.emplace(std::make_pair(body, island));

			for (ConstraintDescriptor* desc : body->constraintDescriptors) {
				bool swap = body != &desc->a.body;
				RigidBody* other = swap ? &desc->a.body : &desc->b.body;
				bool dynamic = swap ? desc->b.isDynamic() : desc->a.isDynamic();
				if (dynamic) exploreIsland(other, island, map);
			}
		}

		Resolver<Constraint2> getConstraintResolver(double dt) {
			sortBodies(true);

			Resolver<Constraint2> resolver;
			for (RigidBody* body : dynBodies)
				for (ConstraintDescriptor* con : body->constraintDescriptors)
					resolver.addConstraint(tryConstraint(*body, *con));

			int islandCount = 0;
			{ // group the bodies into islands
				std::unordered_map<RigidBody*, int> map;
				for (RigidBody* body : simBodies) {
					if (body->constraintDescriptors.size() > 0 && !map.count(body)) {
						exploreIsland(body, islandCount, map);
						islandCount++;
					}
				}
			}

			// attempt to solve position, until various conditions
			// occur that suggest convergence has failed
			double lastError = INFINITY;
			double error;
			int confusion = 0;
			double errorThreshold = CONSTRAINT_ERROR_THRESHOLD * islandCount;

			for (int i = 0; i < CONSTRAINT_ITERATIONS_THRESHOLD; i++) {
				error = resolver.getError();
				if (error < errorThreshold) break;
				if (error > lastError - CONSTRAINT_IMPROVEMENT_THRESHOLD) {
					confusion++;
					if (confusion > CONSTRAINT_CONFUSION_THRESHOLD)
						break;
				}
				lastError = error;
				resolver.solve<&Constraint::solvePosition>(dt, CONSTRAINT_BATCH_SIZE);
			}

			return resolver;
		}
		
		void solveConstraints(Resolver<Constraint2>& resolver, double dt) {
			resolver.solve<&Constraint::solvePosition>(dt, constraintIterations);
			resolver.solve<&Constraint2::recomputeVelocity>(dt);
			resolver.solve<&Constraint::solveVelocity>(dt);
		}
		
		std::vector<CollisionPair> getCollisionPairs(double dt) {
			sortBodies(false);

			hash.build(simBodies, dt);
			std::vector<CollisionPair> collisionPairs;
			for (RigidBody* body : dynBodies)
				if (body->canCollide)
					collisionPairs.emplace_back(body, hash.query(body));
			
			return collisionPairs;
		}

		bool triggerCollision(RigidBody* a, RigidBody* b, const Collision& col) {
			auto collisionKey = a < b ? std::make_pair(a, b) : std::make_pair(b, a);

			if (!triggerCache.count(collisionKey)) {
				bool isTriggerA = a->isTrigger || a->isTriggerWith(*b);
				bool isTriggerB = b->isTrigger || b->isTriggerWith(*a);
	
				onCollide(*a, *b, col.normal, col.contacts, isTriggerA, isTriggerB);

				bool isTrigger = isTriggerA || isTriggerB;
				triggerCache.emplace(std::make_pair(collisionKey, isTrigger));
			}

			return triggerCache.at(collisionKey);
		}
		
		ContactConstraint* tryCollision(RigidBody& a, RigidBody& b, double dt) {
			if (&a == &b) return nullptr;

			std::optional<Collision> col = Detector::collideBodies(a, b);
			
			if (!col || triggerCollision(&a, &b, *col)) return nullptr;

			bool dynamic = Constraint::propagateDynamic(a, b, b.getDynamic(), col->normal);
			
			ContactConstraint* constraint = new ContactConstraint(dynamic, a, b, *col);
			constraint->solvePosition(dt);
			return constraint;
		}

		void solveCollisions(const std::vector<CollisionPair>& collisionPairs, double dt) {
			for (RigidBody* body : dynBodies)
				body->prohibited.clear();
			
			Resolver<ContactConstraint> resolver;
			for (const auto& [body, toCollide] : collisionPairs)
				for (RigidBody* other : toCollide)
					resolver.addConstraint(tryCollision(*body, *other, dt));

			resolver.solve<&ContactConstraint::solveVelocity>(dt, contactIterations);
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

		API void removeBody(RigidBody* body) {
			std::vector<ConstraintDescriptor*> descriptors = body->constraintDescriptors;
			for (ConstraintDescriptor* constraint : descriptors)
				removeConstraint(constraint);
			erase(bodies, body);
		}

		API std::vector<RigidBody*> getBodies() const {
			std::vector<RigidBody*> result;
			for (const auto& body : bodies)
				result.push_back(body.get());
			return result;
		}

		API void addConstraint(ConstraintDescriptor* constraint) {
			constraintDescriptors.emplace_back(constraint);
			constraint->add();
		}

		API void removeConstraint(ConstraintDescriptor* constraint) {
			constraint->remove();
			erase(constraintDescriptors, constraint);
		}

		API std::vector<ConstraintDescriptor*> getConstraintDescriptors() const {
			std::vector<ConstraintDescriptor*> result;
			for (const auto& constraint : constraintDescriptors)
				result.push_back(constraint.get());
			return result;
		}

		API double getKineticEnergy() const {
			double K = 0;
			for (RigidBody* body : dynBodies)
				K += body->getKineticEnergy();
			
			return K;
		}

		API void run(double deltaTime) {
			cacheBodies();

			triggerCache.clear();
			
			Resolver<Constraint2> constraintResolver = getConstraintResolver(deltaTime);
			std::vector<CollisionPair> collisionPairs = getCollisionPairs(deltaTime);
			
			double dt = deltaTime / iterations;
			for (int i = 0; i < iterations; i++) {
				applyForces(dt);
				integrate(dt);
				solveConstraints(constraintResolver, dt);
				solveCollisions(collisionPairs, dt);
			}
		}

		RayHit raycast(const Ray& ray) const {
			RayHit best;

			for (const auto& body : bodies)
				best.add(body->raycast(ray));

			return best;
		}

		friend std::ostream& operator <<(std::ostream& out, const Engine& engine) {
			out << "State(" << engine.simBodies << ", [";
			for (int i = 0; i < engine.constraintDescriptors.size(); i++) {
				out << *engine.constraintDescriptors[i];
				if (i < engine.constraintDescriptors.size() - 1) out << ", ";
			}
			out << "])";

			return out;
		}
};