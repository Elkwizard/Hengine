#pragma once

#include <cmath>

#include "rigidbody.hpp"
#include "matrix.hpp"

RigidBody::RigidBody(double x, double y, bool _dynamic) {
	id = nextID();
	
	dynamic = _dynamic;

	//linear
	position = { x, y };
	lastPosition = { x, y };
	velocity = { };

	//angular
	setAngle(0.0);
	lastAngle = 0.0;
	angularVelocity = 0.0;

	// size
	boundingRadius = 0.0;
	mass = 0.0;
	inertia = 0.0;
	density = 1.0;

	restitution = 0.0;
	friction = 0.5;

	trivialCollisionFilter = true;
	collisionFilter = [&](const RigidBody& body) {
		return ::collideRule(*this, body);
	};
	trivialTriggerFilter = true;
	triggerFilter = [&](const RigidBody& body) {
		return ::triggerRule(*this, body);
	};
	engine = nullptr;

	// booleans
	canRotate = true;
	isTrigger = false;
	canCollide = true;
	gravity = true;
	airResistance = true;
	simulated = true;
}

RigidBody::~RigidBody() {
	for (Collider* collider : shapes)
		delete collider;
}

bool RigidBody::canCollideWith(const RigidBody& body) const {
	return trivialCollisionFilter || collisionFilter(body);
}

bool RigidBody::isTriggerWith(const RigidBody& body) const {
	return !trivialTriggerFilter && triggerFilter(body);
}

bool RigidBody::isProhibited(const Vector& direction) const {
	for (const Vector& dir : prohibitedDirections)
		if (dir.dot(direction) > 0.8)
			return true;

	return false;
}

void RigidBody::prohibit(const Vector& direction) {
	prohibitedDirections.push_back(direction);
}

void RigidBody::setDensity(double a) {
	double f = a / density;
	mass *= f;
	inertia *= f;
	density = a;
}

void RigidBody::setAngle(double a) {
	angle = a;
	cosAngle = cos(a);
	sinAngle = sin(a);
	invalidateModels();
}

void RigidBody::updateLastData() {
	lastAngle = angle;
	lastPosition = position;
}

void RigidBody::integrate(double intensity) {
	displace(velocity * intensity);
	if (canRotate) setAngle(angle + angularVelocity * intensity);
}

void RigidBody::integratePosition(double intensity) { // does not move models, only use for grid
	position += velocity * intensity;
}

void RigidBody::displace(const Vector& v) {
	if (!dynamic) return;
	position += v;
	for (Collider* collider : shapes)
		collider->displaceCache(v);
}

void RigidBody::invalidateModels() {
	for (Collider* collider : shapes)
		collider->invalidateCache();
}

Model* RigidBody::getModel(int i) {
	Collider* shape = shapes[i];
	shape->invalidateCache();
	return shape->cacheModel(position, cosAngle, sinAngle);
}

std::vector<Model*> RigidBody::getModels() {
	std::vector<Model*> models { };
	for (int i = 0; i < shapes.size(); i++)
		models.push_back(getModel(i));
	return models;
}

Model* RigidBody::cacheModel(int i) {
	return shapes[i]->cacheModel(position, cosAngle, sinAngle);
}

std::vector<Model*> RigidBody::cacheModels() {
	std::vector<Model*> models { };
	for (int i = 0; i < shapes.size(); i++)
		models.push_back(cacheModel(i));
	return models;
}

void RigidBody::addShape(Collider* sh) {
	shapes.push_back(sh);
	sh->computeMatterData();
	mass += sh->mass * density;
	inertia += sh->inertia * density;
	if (sh->boundingRadius > boundingRadius)
		boundingRadius = sh->boundingRadius;
	invalidateModels();
}

void RigidBody::removeShape(Collider* sh) {
	auto it = std::find(shapes.begin(), shapes.end(), sh);
	if (it != shapes.end()) {
		shapes.erase(it);
		delete sh;

		invalidateModels();
		
		// don't just subtract shape's mass and inertia in case mass was changed elsewhere
		mass = 0.0;
		inertia = 0.0;
		boundingRadius = 0.0;
		for (Collider* shape : shapes) {
			mass += shape->mass * density;
			inertia += shape->inertia * density;
			if (shape->boundingRadius > boundingRadius)
				boundingRadius = shape->boundingRadius;
		}
	}
}

void RigidBody::clearShapes() {
	for (Collider* collider : shapes)
		delete collider;
	shapes.clear();
	invalidateModels();
	mass = 0.0;
	inertia = 0.0;
	boundingRadius = 0.0;
}

void RigidBody::stop() {
	velocity = { };
	angularVelocity = 0.0;
}

Vector RigidBody::pointVelocity(const Vector& p) const {
	if (!dynamic) return { };

	return (p - position).normal() * angularVelocity + velocity;
}

Vector RigidBody::pointForce(const Vector& p) const {
	return -Matrix::force1ToZero(*this, p);
}

void RigidBody::applyImpulse(const Vector& pos, const Vector& imp, double factor) {
	applyRelativeImpulse(pos - position, imp, factor);
}

void RigidBody::applyRelativeImpulse(const Vector& offset, const Vector& imp, double factor) {
	if (!dynamic || !mass) return;

	Vector scaled = imp * factor;

	velocity += scaled / mass;

	if (canRotate) {
		double cross = offset.cross(scaled);
		if (cross) angularVelocity += cross / inertia;
	}
}

RigidBody* RigidBody::fromPolygon(std::vector<Vector> vertices, bool dynamic) {
	Vector position = { };
	for (const Vector& vec : vertices)
		position += vec;
	position /= vertices.size();

	for (Vector& vec : vertices)
		vec -= position;
	
	RigidBody* body = new RigidBody(position.x, position.y, dynamic);
	body->addShape(new PolygonCollider(vertices));
	return body;
}

RigidBody* RigidBody::fromRect(double x, double y, double w, double h, bool dynamic) {
	RigidBody* body = new RigidBody(x, y, dynamic);
	body->addShape(new PolygonCollider({
		{ -w / 2, -h / 2 },
		{ w / 2, -h / 2 },
		{ w / 2, h / 2 },
		{ -w / 2, h / 2 }
	}));
	return body;
}

RigidBody* RigidBody::fromCircle(double x, double y, double r, bool dynamic) {
	RigidBody* body = new RigidBody(x, y, dynamic);
	body->addShape(new CircleCollider(0, 0, r));
	return body;
}