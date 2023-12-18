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
	canMoveThisStep = true;

	collisionFilter = [&](const RigidBody& body) {
		return ::collideRule(this, (RigidBody*)&body);
	};
	triggerFilter = [&](const RigidBody& body) {
		return ::triggerRule(this, (RigidBody*)&body);
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
	for (BaseCollider* collider : shapes)
		delete collider;
}

void RigidBody::setDensity(double a) {
	double f = a / density;
	mass *= f;
	inertia *= f;
	density = f;
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
	for (BaseCollider* collider : shapes)
		collider->displaceCache(v);
}
		

void RigidBody::invalidateModels() {
	for (BaseCollider* collider : shapes)
		collider->invalidateCache();
}

BaseModel* RigidBody::getModel(int i) {
	BaseCollider* shape = shapes[i];
	shape->invalidateCache();
	return shape->cacheModel(position, cosAngle, sinAngle);
}

std::vector<BaseModel*> RigidBody::getModels() {
	std::vector<BaseModel*> models { };
	for (int i = 0; i < shapes.size(); i++)
		models.push_back(getModel(i));
	return models;
}

BaseModel* RigidBody::cacheModel(int i) {
	return shapes[i]->cacheModel(position, cosAngle, sinAngle);
}

std::vector<BaseModel*> RigidBody::cacheModels() {
	std::vector<BaseModel*> models { };
	for (int i = 0; i < shapes.size(); i++)
		models.push_back(cacheModel(i));
	return models;
}

void RigidBody::addShape(BaseCollider* sh) {
	shapes.push_back(sh);
	sh->computeMatterData();
	mass += sh->mass * density;
	inertia += sh->inertia * density;
	if (sh->boundingRadius > boundingRadius)
		boundingRadius = sh->boundingRadius;
	invalidateModels();
}

void RigidBody::removeShape(BaseCollider* sh) {
	auto it = std::find(shapes.begin(), shapes.end(), sh);
	if (it != shapes.end()) {
		shapes.erase(it);
		delete sh;

		invalidateModels();
		
		// don't just subtract shape's mass and inertia in case mass was changed elsewhere
		mass = 0.0;
		inertia = 0.0;
		boundingRadius = 0.0;
		for (BaseCollider* shape : shapes) {
			mass += shape->mass * density;
			inertia += shape->inertia * density;
			if (shape->boundingRadius > boundingRadius)
				boundingRadius = shape->boundingRadius;
		}
	}
}

void RigidBody::clearShapes() {
	for (BaseCollider* collider : shapes)
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
	if (!dynamic || mass == 0.0) return;
	
	Vector scaled = imp * factor;

	//linear
	velocity += scaled / mass;

	//angular
	if (canRotate) {
		double cross = (pos - position).cross(scaled);
		if (cross) angularVelocity += cross / inertia;
	}
}

void RigidBody::applyRelativeImpulse(const Vector& pos, const Vector& imp, double factor) {
	applyImpulse(pos + position, imp, factor);
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