#pragma once

#include "constraints.hpp"

Constraint::Constraint(Type _type) {
	id = nextID();
	type = _type;
}

Vector Constraint1::combineError(const Vector &positionError, const Vector &velocityError) {
	return (positionError + velocityError) * INTENSITY;
}

Constraint1::Constraint1(Type _type, RigidBody &_body, const Vector &_offset, const Vector &_point) : Constraint(_type), body(_body) {
	offset = _offset;
	point = _point;
}

Vector& Constraint1::getA() {
	double ax = offset.x;
	double ay = offset.y;
	double ac = body.cosAngle;
	double as = body.sinAngle;
	double t_ax = ax * ac - ay * as;
	double t_ay = ax * as + ay * ac;

	a = body.position + Vector(t_ax, t_ay);

	return a;
}

Vector& Constraint1::getB() {
	b = point;

	return b;
}

void Constraint1::add() {
	body.constraints.push_back(this);
}

bool Constraint1::hasBody(const RigidBody &b) const {
	return body.id == b.id;
}

void Constraint1::solve() {
	if (!body.engine) return;

	if (body.dynamic) {
		Vector& a = getA();
		Vector& b = getB();
		
		// velocity
		Vector rA = a - body.position;
		double mA = 1.0 / body.mass;
		double iA = body.canRotate ? 1.0 / body.inertia : 0.0;

		forceToError.a = mA + iA * pow(rA.y, 2);
		forceToError.b = -iA * rA.x * rA.y;
		forceToError.c = forceToError.b;
		forceToError.d = mA + iA * pow(rA.x, 2);

		std::optional<Vector> force = forceToError.applyInverseTo(getError());
		
		if (!force) return;

		body.applyImpulse(a, *force);
	}
}

void Constraint1::remove() {
	std::vector<Constraint*>& constraints = body.constraints;
	constraints.erase(std::find(constraints.begin(), constraints.end(), this));
}

Vector Constraint2::combineError(const Vector &positionError, const Vector &velocityError) {
	return (positionError + velocityError) * INTENSITY;
}

Constraint2::Constraint2(Type _type, RigidBody &a, RigidBody &b, const Vector &aOff, const Vector &bOff) : Constraint(_type), bodyA(a), bodyB(b) {
	staticA = false;
	staticB = false;
	offsetA = aOff;
	offsetB = bOff;

	double mA = getDynamicA() ? 1.0 / a.mass : 0.0;
	double mB = getDynamicB() ? 1.0 / b.mass : 0.0;
	forceToError = {
		mA + mB, 0.0,
		0.0, mA + mB
	};
}

bool Constraint2::getDynamicA() const {
	return !staticA && bodyA.dynamic;
}

bool Constraint2::getDynamicB() const {
	return !staticB && bodyB.dynamic;
}

Vector& Constraint2::getA() {
	double ax = offsetA.x;
	double ay = offsetA.y;
	double ac = bodyA.cosAngle;
	double as = bodyA.sinAngle;
	double t_ax = ax * ac - ay * as;
	double t_ay = ax * as + ay * ac;

	a = bodyA.position + Vector(t_ax, t_ay);
	
	return a;
}

Vector& Constraint2::getB() {
	double bx = offsetB.x;
	double by = offsetB.y;
	double bc = bodyB.cosAngle;
	double bs = bodyB.sinAngle;
	double t_bx = bx * bc - by * bs;
	double t_by = bx * bs + by * bc;

	b = bodyB.position + Vector(t_bx, t_by);

	return b;
}

void Constraint2::add() {
	bodyA.constraints.push_back(this);
	bodyB.constraints.push_back(this);
}

bool Constraint2::hasBody(const RigidBody &b) const {
	return bodyA.id == b.id || bodyB.id == b.id;
}

void Constraint2::solve() {
	if (!bodyA.engine || !bodyB.engine) return;

	bool dynamicA = getDynamicA();
	bool dynamicB = getDynamicB();

	if (dynamicA || dynamicB) {
		Vector& a = getA();
		Vector& b = getB();

		// velocity
		Vector rA = a - bodyA.position;
		Vector rB = b - bodyB.position;
		double mA = dynamicA ? 1.0 / bodyA.mass : 0.0;
		double mB = dynamicB ? 1.0 / bodyB.mass : 0.0;
		double mAB = mA + mB;
		double iA = (dynamicA && bodyA.canRotate) ? 1.0 / bodyA.inertia : 0.0;
		double iB = (dynamicB && bodyB.canRotate) ? 1.0 / bodyB.inertia : 0.0;

		// // correct equation
		// forceToError.a = mA + iA * rA.y ** 2 + mB + iB * rB.y ** 2;
		// forceToError.b = -iA * rA.x * rA.y - iB * rB.x * rB.y;
		// forceToError.c = forceToError.b;
		// forceToError.d = mA + iA * rA.x ** 2 + mB + iB * rB.x ** 2;

		// optimized
		forceToError.a = mAB + (iA * rA.y * rA.y) + (iB * rB.y * rB.y);
		forceToError.b = (-iA * rA.x * rA.y) - (iB * rB.x * rB.y);
		forceToError.c = forceToError.b;
		forceToError.d = mAB + (iA * rA.x * rA.x) + (iB * rB.x * rB.x);

		std::optional<Vector> force = forceToError.applyInverseTo(getError());

		if (!force) return;

		if (dynamicA) bodyA.applyImpulse(a, *force);
		if (dynamicB) bodyB.applyImpulse(b, -*force);
	}
}

void Constraint2::remove() {
	std::vector<Constraint*>& constraintsA = bodyA.constraints;
	constraintsA.erase(std::find(constraintsA.begin(), constraintsA.end(), this));
	
	std::vector<Constraint*>& constraintsB = bodyB.constraints;
	constraintsB.erase(std::find(constraintsB.begin(), constraintsB.end(), this));
}

class LengthConstraint2 : public Constraint2 {
	public:
		double length;

	protected:
		Vector getError() override {
			Vector n = b - a;
			double mag = n.mag();
			if (!mag) return { };
			n /= mag;
			Vector currentPositionError = n * (mag - length);
			Vector currentVelocityError = n * (bodyB.pointVelocity(b).dot(n) - bodyA.pointVelocity(a).dot(n));

			return Constraint2::combineError(currentPositionError, currentVelocityError);
		}
		
	public:
		LengthConstraint2(RigidBody& a, RigidBody& b, const Vector& ao, const Vector& bo, double l) : Constraint2(LENGTH2, a, b, ao, bo) {
			length = l;
		}
    
};

CONSTRUCT(LengthConstraint2)(RigidBody* a, RigidBody* b, Vector* ao, Vector* bo, double l) {
	return new LengthConstraint2(*a, *b, *ao, *bo, l);
}

ACCESS(LengthConstraint2, length, double);

class PositionConstraint2 : public Constraint2 {
	protected:
		Vector getError() override {
			Vector currentVelocityError = bodyB.pointVelocity(b) - bodyA.pointVelocity(a);
			Vector currentPositionError = b - a;
			return Constraint2::combineError(currentPositionError, currentVelocityError);
		}
		
	public:
		PositionConstraint2(RigidBody& a, RigidBody& b, const Vector& ao, const Vector& bo) : Constraint2(POSITION2, a, b, ao, bo) { }
};

CONSTRUCT(PositionConstraint2)(RigidBody* a, RigidBody* b, Vector* ao, Vector* bo) {
	return new PositionConstraint2(*a, *b, *ao, *bo);
}
FREE(PositionConstraint2)

class LengthConstraint1 : public Constraint1 {
	public:
		double length;

    protected:
		Vector getError() override {
			Vector n = b - a;
			double mag = n.mag();
			if (!mag) return { };
			n /= mag;
			Vector currentPositionError = n * (mag - length);
			Vector currentVelocityError = n * -body.pointVelocity(a).dot(n);

			return Constraint1::combineError(currentPositionError, currentVelocityError);
		}

	public:
		LengthConstraint1(RigidBody& body, const Vector& offset, const Vector& point, double _length) : Constraint1(LENGTH1, body, offset, point) {
			length = _length;
		}
};

CONSTRUCT(LengthConstraint1)(RigidBody* body, Vector* o, Vector* p, double length) {
	return new LengthConstraint1(*body, *o, *p, length);
}
FREE(LengthConstraint1)

ACCESS(LengthConstraint1, length, double)

class PositionConstraint1 : public Constraint1 {
	protected:
		Vector getError() override {
			Vector currentVelocityError = -body.pointVelocity(a);
			Vector currentPositionError = b - a;
			return Constraint1::combineError(currentPositionError, currentVelocityError);
		}

	public:
		PositionConstraint1(RigidBody& body, const Vector& offset, const Vector& point) : Constraint1(POSITION1, body, offset, point) { }
};

CONSTRUCT(PositionConstraint1)(RigidBody* body, Vector* o, Vector* p) {
	return new PositionConstraint1(*body, *o, *p);
}
FREE(PositionConstraint1)