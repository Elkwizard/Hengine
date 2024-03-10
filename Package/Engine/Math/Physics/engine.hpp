#pragma once

#include <unordered_map>
#include <unordered_set>

class PhysicsEngine;

#include "exports.hpp"
#include "rigidbody.hpp"
#include "grid.hpp"
#include "detector.hpp"
#include "resolver.hpp"
#include "order.hpp"

extern "C" void onCollide(PhysicsEngine*, RigidBody*, RigidBody*, Vector*, NativeVectorArray*, bool, bool);

class PhysicsEngine {
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

		int contactIterations;
		int iterations;
		int constraintIterations;

		Vector gravity;
		double drag;

		using Response = std::function<void(RigidBody&, RigidBody&, const Vector&, const std::vector<Vector>&, bool, bool)>;
		Response onCollide;

		OrderGenerator orderGenerator;

		PhysicsEngine(const Vector& gravity);
		~PhysicsEngine();
		
		void run();
		
		Constraints getConstraints() const;
		void addConstraint(Constraint& constraint);
		void removeConstraint(ID id);
		
		Bodies getBodies() const;
		bool hasBody(ID id) const;
		RigidBody& getBody(ID id) const;
		void addBody(RigidBody& body);
		void removeBody(ID id);
};

CONSTRUCT(PhysicsEngine)(Vector* gravity) { return new PhysicsEngine(*gravity); }
FREE(PhysicsEngine)

FN(PhysicsEngine, addBody, void)(PhysicsEngine* engine, RigidBody* body) { engine->addBody(*body); }
FN(PhysicsEngine, hasBody, bool)(PhysicsEngine* engine, ID id) { return engine->hasBody(id); }
FN(PhysicsEngine, removeBody, void)(PhysicsEngine* engine, ID id) { engine->removeBody(id); }
OBJECT_FN(PhysicsEngine, getBody, RigidBody)(PhysicsEngine* engine, ID id) { return &engine->getBody(id); }
OBJECT_FN(PhysicsEngine, getBodies, NativeRigidBodyArray)(PhysicsEngine* engine) { return new NativeRigidBodyArray(engine->getBodies()); }

FN(PhysicsEngine, addConstraint, void)(PhysicsEngine* engine, Constraint* con) { engine->addConstraint(*con); }
FN(PhysicsEngine, removeConstraint, void)(PhysicsEngine* engine, ID id) { engine->removeConstraint(id); }
OBJECT_FN(PhysicsEngine, getConstraints, NativeConstraintArray)(PhysicsEngine* engine) { return new NativeConstraintArray(engine->getConstraints()); }

FN_NO(PhysicsEngine, run)

ACCESS(PhysicsEngine, iterations, int);
ACCESS(PhysicsEngine, constraintIterations, int);
ACCESS(PhysicsEngine, contactIterations, int);
OBJECT_ACCESS(PhysicsEngine, gravity, Vector);