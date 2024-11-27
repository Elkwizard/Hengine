#include "engine.hpp"

#include <algorithm>
#include <memory>

PhysicsEngine::PhysicsEngine(const Vector& _gravity) : orderGenerator(123456), collisionResolver(*this) {
	gravity = _gravity;

	drag = 0.005;
	constraintIterations = 5;
	iterations = 5;
	contactIterations = 8;

	onCollide = [&](RigidBody& a, RigidBody& b, const Vector& dir, const std::vector<Vector>& contacts, bool triggerA, bool triggerB) {
		::onCollide(*this, a, b, dir, contacts, triggerA, triggerB);
	};
}

PhysicsEngine::~PhysicsEngine() {
	for (RigidBody* body : getBodies())
		removeBody(body->id);

	for (Constraint* con : getConstraints())
		removeConstraint(con->id);
}

Bodies PhysicsEngine::getBodies() const {
	Bodies result { };
	for (const auto& entry : bodyMap)
		result.push_back(entry.second);
	return result;
}

Bodies PhysicsEngine::getSimulatedBodies() const {
	Bodies result { };
	for (const auto& entry : bodyMap)
		if (entry.second->simulated)
			result.push_back(entry.second);
	return result;
}

Constraints PhysicsEngine::getConstraints() const {
	Constraints result { };
	for (const auto& entry : constraintMap)
		result.push_back(entry.second);
	return result;
}

void PhysicsEngine::addConstraint(Constraint* constraint) {
	constraint->add();
	constraintMap.insert_or_assign(constraint->id, constraint);
}

void PhysicsEngine::removeConstraint(ID id) {
	if (!constraintMap.count(id)) return;

	Constraint* con = constraintMap.at(id);
	con->remove();
	constraintMap.erase(id);

	delete con;
}

void PhysicsEngine::solveConstraints() {
	Constraints constraints = getConstraints();
	orderGenerator.shuffle(constraints);
	for (Constraint* constraint : constraints)
		constraint->solve();
}

void PhysicsEngine::applyForces(Bodies& dynBodies, double intensity) {
	double dragFactor = pow(1.0 - drag, intensity);
	Vector gravitationalAcceleration = gravity * intensity;
	for (RigidBody* body : dynBodies) {
		if (!body->dynamic) continue;
		
		if (body->gravity)
			body->velocity += gravitationalAcceleration;
		
		if (body->airResistance) {
			body->velocity *= dragFactor;
			body->angularVelocity *= dragFactor;
		}
	}
}

void PhysicsEngine::integrate(Bodies& dynBodies, double intensity) {
	for (RigidBody* body : dynBodies) {
		if (!body->dynamic) continue;
		body->integrate(intensity);
	}
}

void PhysicsEngine::integratePosition(Bodies& dynBodies, double intensity) { // doesn't move models, only useful for grid
	for (RigidBody* body : dynBodies) {
		if (!body->dynamic) continue;
		body->integratePosition(intensity);
	}
}

void PhysicsEngine::resolve(std::unique_ptr<Collision>& col) {
	RigidBody& bodyA = *col->bodyA;
	RigidBody& bodyB = *col->bodyB;
	Vector& direction = col->direction;
	std::vector<Vector>& contacts = col->contacts;
	double penetration = col->penetration; 

	if (!penetration) return;

	bool isTriggerA = bodyA.isTrigger || bodyA.isTriggerWith(bodyB);
	bool isTriggerB = bodyB.isTrigger || bodyB.isTriggerWith(bodyA);

	{ // detect first collision per pair
		uint64_t aID = bodyA.id;
		uint64_t bID = bodyB.id;
		if (bID < aID) std::swap(aID, bID);

		uint64_t key = aID << 32 | bID;
		
		if (!noticedCollisions.count(key)) {
			noticedCollisions.insert(key);
			onCollide(bodyA, bodyB, direction, contacts, isTriggerA, isTriggerB);
		}
	}

	if (isTriggerA || isTriggerB) return;

	bool dynamic = bodyB.dynamic && !bodyB.isProhibited(direction);
	if (!dynamic) bodyA.prohibit(direction);
	
	collisionResolver.resolve(dynamic, col);
}

void PhysicsEngine::collisions(CollisionPairs& collisionPairs) {
	//collisions
	for (auto& entry : collisionPairs) {
		RigidBody& body = *entry.first;
		Bodies& collidable = entry.second;

		//mobilize
		body.prohibitedDirections.clear();
		
		Vector& vel = body.velocity;
		std::sort(collidable.begin(), collidable.end(), [&](RigidBody* a, RigidBody* b) {
			return (a->position - b->position).dot(vel) < 0.0;
		});

		for (RigidBody* body2 : collidable) {
			std::unique_ptr<Collision> collision = CollisionDetector::collideBodies(body, *body2);
			if (collision) resolve(collision);
		}
	}

	collisionResolver.resolveAllContacts();
}

PhysicsEngine::CollisionPairs PhysicsEngine::createGrid(Bodies& dynBodies) {
	Bodies bodies = getSimulatedBodies();

	double cellSize = 50.0;
	if (bodies.size()) {
		double meanRadius = 0;
		double total = 0;
		for (RigidBody* body : bodies) {
			meanRadius += body->boundingRadius;
			if (body->boundingRadius) total++;
		}
		meanRadius /= total;
		if (meanRadius)
			cellSize = meanRadius;
	}

	Grid grid { cellSize };
	
	//create grid
	for (RigidBody* body : bodies) {
		if (!body->canCollide) continue;

		grid.cellsBounds(*body);
	}

	CollisionPairs collisionPairs { };

	for (RigidBody* body : dynBodies) {
		if (!body->canCollide) continue;

		Bodies bodies = grid.query(*body, [&](const RigidBody& b) {
			return body->canCollideWith(b) && b.canCollideWith(*body);
		});
		
		if (bodies.size())
			collisionPairs[body] = bodies;
	}
	
	return collisionPairs;
}

void PhysicsEngine::run() {
	Bodies dynBodies { };
	for (RigidBody* body : getSimulatedBodies())
		if (body->dynamic) dynBodies.push_back(body);
	
	std::sort(dynBodies.begin(), dynBodies.end(), [&](RigidBody* a, RigidBody* b) {
		return (b->position - a->position).dot(gravity) < 0.0;
	});

	// approximate where they'll be at the end of the frame
	integratePosition(dynBodies, 1);
	CollisionPairs collisionPairs = createGrid(dynBodies);
	integratePosition(dynBodies, -1);

	noticedCollisions.clear();

	double intensity = 1.0 / iterations;

	// solve
	for (step = 0; step < iterations; step++) {
		integrate(dynBodies, intensity);
		applyForces(dynBodies, intensity);
		for (int i = 0; i < constraintIterations; i++)
			solveConstraints();
		collisions(collisionPairs);
	}
}

bool PhysicsEngine::hasBody(ID id) const {
	return bodyMap.count(id);
}

RigidBody& PhysicsEngine::getBody(ID id) const {
	return *bodyMap.at(id);
}

void PhysicsEngine::addBody(RigidBody* body) {
	body->engine = this;
	bodyMap.insert_or_assign(body->id, body);
}

void PhysicsEngine::removeBody(ID id) {
	if (!hasBody(id)) return;

	RigidBody& body = getBody(id);
	bodyMap.erase(id);

	while (body.constraints.size())
		removeConstraint(body.constraints[0]->id);

	body.engine = nullptr;

	delete &body;
}