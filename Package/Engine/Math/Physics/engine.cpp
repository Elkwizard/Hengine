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
		std::unique_ptr<NativeVectorArray> arr = std::make_unique<NativeVectorArray>(contacts);
		::onCollide(this, &a, &b, (Vector*)&dir, arr.get(), triggerA, triggerB);
	};
}

PhysicsEngine::~PhysicsEngine() {
	for (RigidBody* body : getBodies())
		removeBody(body->id);

	for (Constraint* con : getConstraints())
		removeConstraint(con->id);
}

PhysicsEngine::Bodies PhysicsEngine::getBodies() const {
	Bodies result { };
	for (const auto& entry : bodyMap)
		result.push_back(entry.second);
	return result;
}

PhysicsEngine::Constraints PhysicsEngine::getConstraints() const {
	Constraints result { };
	for (const auto& entry : constraintMap)
		result.push_back(entry.second);
	return result;
}

void PhysicsEngine::addConstraint(Constraint& constraint) {
	constraint.add();
	constraintMap.insert_or_assign(constraint.id, &constraint);
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

	bool isTriggerA = bodyA.isTrigger || bodyA.triggerFilter(bodyB);
	bool isTriggerB = bodyB.isTrigger || bodyB.triggerFilter(bodyA);

	onCollide(bodyA, bodyB, direction, contacts, isTriggerA, isTriggerB);

	if (isTriggerA || isTriggerB) return;

	bool dynamic = bodyB.dynamic;
	bool prohibited = false;

	if (dynamic) for (int i = 0; i < bodyB.prohibitedDirections.size(); i++) {
		double dot = bodyB.prohibitedDirections[i].dot(direction);
		if (dot > 0.8) {
			prohibited = true;
			break;
		}
	}
	if (!dynamic || prohibited)
		bodyA.prohibitedDirections.push_back(direction);
		
	collisionResolver.resolve(dynamic, prohibited, col);

	//immobilize
	bodyA.canMoveThisStep = false;
}

void PhysicsEngine::collisions(Bodies& dynBodies, CollisionPairs& collisionPairs, const Order& order) {
	Bodies colBodies { };
	for (RigidBody* body : dynBodies)
		if (body->canCollide) colBodies.push_back(body);
	
	std::sort(colBodies.begin(), colBodies.end(), order);

	//collisions
	for (RigidBody* body : colBodies) {
		//mobilize
		body->canMoveThisStep = true;
		body->prohibitedDirections.clear();

		Bodies& collidable = collisionPairs.at(body);
		
		Vector& vel = body->velocity;
		std::sort(collidable.begin(), collidable.end(), [&](RigidBody* a, RigidBody* b) {
			return (a->position - b->position).dot(vel) < 0.0;
		});

		for (RigidBody* body2 : collidable) {
			std::unique_ptr<Collision> collision = CollisionDetector::collideBodies(*body, *body2);
			if (collision) resolve(collision);
		}
	}

	collisionResolver.resolveAllContacts();
}

PhysicsEngine::CollisionPairs PhysicsEngine::createGrid(Bodies& dynBodies) {
	Bodies bodies = getBodies();

	double cellSize = 50.0;
	if (bodies.size()) {
		double meanRadius = 0;
		double total = 0;
		for (RigidBody* body : bodies) {
			meanRadius += body->boundingRadius;;
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
			return body->collisionFilter(b) && b.collisionFilter(*body);
		});
		
		collisionPairs[body] = bodies;
	}
	
	return collisionPairs;
}

void PhysicsEngine::run() {
	Bodies dynBodies { };
	for (RigidBody* body : getBodies())
		if (body->dynamic) dynBodies.push_back(body);

	// approximate where they'll be at the end of the frame
	integratePosition(dynBodies, 1);
	CollisionPairs collisionPairs = createGrid(dynBodies);
	integratePosition(dynBodies, -1);

	//sorts
	Order gravitySort = [&](RigidBody* a, RigidBody* b) {
		return (b->position - a->position).dot(gravity) < 0.0;
	};

	double intensity = 1.0 / iterations;

	// solve
	for (step = 0; step < iterations; step++) {
		integrate(dynBodies, intensity);
		applyForces(dynBodies, intensity);
		for (int i = 0; i < constraintIterations; i++)
			solveConstraints();
		collisions(dynBodies, collisionPairs, gravitySort);
	}
}

bool PhysicsEngine::hasBody(ID id) const {
	return bodyMap.count(id);
}

RigidBody& PhysicsEngine::getBody(ID id) const {
	return *bodyMap.at(id);
}

void PhysicsEngine::addBody(RigidBody& body) {
	body.engine = this;
	bodyMap.insert_or_assign(body.id, &body);
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