#pragma once

#include <unordered_map>
#include <unordered_set>

class PhysicsEngine;

#include "global.hpp"
#include "rigidbody.hpp"
#include "grid.hpp"
#include "detector.hpp"
#include "resolver.hpp"
#include "order.hpp"

API_IMPORT void onCollide(PhysicsEngine&, RigidBody&, RigidBody&, const Vector&, const std::vector<Vector>&, bool, bool);

API class PhysicsEngine {
	private:
		std::unordered_map<ID, RigidBody*> bodyMap { };
		std::unordered_map<ID, Constraint*> constraintMap { };
		CollisionResolver collisionResolver;

		std::unordered_set<uint64_t> noticedCollisions { };

		using CollisionPairs = std::unordered_map<RigidBody*, std::vector<RigidBody*>>;
		
		void solveConstraints();
		void applyForces(Bodies& dynBodies, double intensity);
		void integrate(Bodies& dynBodies, double intensity);
		void integratePosition(Bodies& dynBodies, double intensity);
		void resolve(std::unique_ptr<Collision>& col);
		void collisions(CollisionPairs& collisionPairs);
		CollisionPairs createGrid(Bodies& dynBodies);
		Bodies getSimulatedBodies() const;

	public:
		int step;

		API int contactIterations;
		API int iterations;
		API int constraintIterations;

		API Vector gravity;
		API double drag;

		using Response = std::function<void(RigidBody&, RigidBody&, const Vector&, const std::vector<Vector>&, bool, bool)>;
		Response onCollide;

		OrderGenerator orderGenerator;

		API PhysicsEngine(const Vector& gravity);
		~PhysicsEngine();
		
		API void run();
		
		API Constraints getConstraints() const;
		API void addConstraint(Constraint* constraint);
		API void removeConstraint(ID id);
		
		API Bodies getBodies() const;
		API bool hasBody(ID id) const;
		API RigidBody& getBody(ID id) const;
		API void addBody(RigidBody* body);
		API void removeBody(ID id);
};