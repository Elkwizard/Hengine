#pragma once

#include <functional>

class RigidBody;

#include "exports.hpp"
#include "colliders.hpp"
#include "engine.hpp"
#include "constraints.hpp"

extern "C" bool collideRule(RigidBody*, RigidBody*);
extern "C" bool triggerRule(RigidBody*, RigidBody*);

template <>
class std::hash<RigidBody*> {
	public:
		size_t operator()(RigidBody* ptr) const {
			return 1478611 * (size_t)ptr;
		}
};

class Bounds {
	public:
		int minX, minY;
		int maxX, maxY;

		Bounds() { }

		Bounds(int _minX, int _minY, int _maxX, int _maxY) {
			minX = _minX;
			minY = _minY;
			maxX = _maxX;
			maxY = _maxY;
		}
};

class RigidBody {
	public:
		ID id;

		Vector position, lastPosition;
		double angle, lastAngle;
		double cosAngle, sinAngle;

		Vector velocity;
		double angularVelocity;

		double mass, inertia, density;
		double boundingRadius;
		Bounds bounds;

		double restitution;
		double friction;

		bool canRotate, dynamic, simulated, airResistance, gravity, isTrigger, canCollide;

		PhysicsEngine* engine;

		using Filter = std::function<bool (const RigidBody&)>;

		bool trivialCollisionFilter, trivialTriggerFilter;
		Filter collisionFilter, triggerFilter;

		std::vector<Vector> prohibitedDirections { };

		std::vector<Collider*> shapes { };
		std::vector<Constraint*> constraints { };

		RigidBody(double x, double y, bool _dynamic);
		~RigidBody();

		bool canCollideWith(const RigidBody& body) const;
		bool isTriggerWith(const RigidBody& body) const;
		bool isProhibited(const Vector& direction) const;
		void prohibit(const Vector& direction);
		void setDensity(double a);
		void setAngle(double a);
		void updateLastData();
		void displace(const Vector& v);
		void invalidateModels();
		Model* getModel(int i);
		std::vector<Model*> getModels();
		Model* cacheModel(int i);
		std::vector<Model*> cacheModels();
		void clearShapes();
		void removeShape(Collider* shape);
		void addShape(Collider* shape);
		void integrate(double intensity);
		void integratePosition(double intensity);
		void stop();
		Vector pointVelocity(const Vector& p) const;
		Vector pointForce(const Vector& p) const;
		void applyImpulse(const Vector& pos, const Vector& imp, double factor = 1.0);
		void applyRelativeImpulse(const Vector& pos, const Vector& imp, double factor = 1.0);

		static RigidBody* fromPolygon(std::vector<Vector> vertices, bool dynamic = true);
		static RigidBody* fromRect(double x, double y, double w, double h, bool dynamic = true);
		static RigidBody* fromCircle(double x, double y, double r, bool dynamic = true);
};

using Bodies = std::vector<RigidBody*>;

CONSTRUCT(RigidBody)(double x, double y, bool dynamic) { return new RigidBody(x, y, dynamic); }
FREE(RigidBody);

FN(RigidBody, addShape, void)(RigidBody* body, Collider* shape) { body->addShape(shape); }
FN(RigidBody, removeShape, void)(RigidBody* body, Collider* shape) { body->removeShape(shape); }
FN_NO(RigidBody, stop)
FN_NO(RigidBody, invalidateModels)
FN(RigidBody, applyImpulse, void)(RigidBody* body, Vector* point, Vector* impulse) {
	body->applyImpulse(*point, *impulse);
}
OBJECT_FN(RigidBody, getConstraints, NativeConstraintArray)(RigidBody* body) {
	return new NativeConstraintArray(body->constraints);
}

ACCESS(RigidBody, id, int)

ACCESS(RigidBody, dynamic, bool)
ACCESS(RigidBody, canRotate, bool)
ACCESS(RigidBody, canCollide, bool)
ACCESS(RigidBody, simulated, bool)
ACCESS(RigidBody, airResistance, bool)
ACCESS(RigidBody, gravity, bool)
ACCESS(RigidBody, isTrigger, bool)

ACCESS(RigidBody, friction, double)
ACCESS(RigidBody, restitution, double)

ACCESS(RigidBody, trivialCollisionFilter, bool)
ACCESS(RigidBody, trivialTriggerFilter, bool)

ACCESS(RigidBody, boundingRadius, double)
ACCESS(RigidBody, mass, double)
ACCESS(RigidBody, inertia, double)
GETTER(RigidBody, density, double) { return object->density; }
SETTER(RigidBody, density, double) { object->setDensity(value); }

ACCESS(RigidBody, angularVelocity, double)
GETTER(RigidBody, angle, double) { return object->angle; }
SETTER(RigidBody, angle, double) { object->setAngle(value); }
OBJECT_ACCESS(RigidBody, velocity, Vector)
OBJECT_ACCESS(RigidBody, position, Vector)

STATIC_OBJECT_FN(RigidBody, fromPolygon, RigidBody)(NativeVectorArray* vertices, bool dynamic) {
	return RigidBody::fromPolygon(vertices->data, dynamic);
}

STATIC_OBJECT_FN(RigidBody, fromRect, RigidBody)(double x, double y, double w, double h, bool dynamic) {
	return RigidBody::fromRect(x, y, w, h, dynamic);
}

STATIC_OBJECT_FN(RigidBody, fromCircle, RigidBody)(double x, double y, double r, bool dynamic) {
	return RigidBody::fromCircle(x, y, r, dynamic);
}

using NativeRigidBodyArray = NativeArray<RigidBody*>;

CONSTRUCT(NativeRigidBodyArray)(int length) { return new NativeRigidBodyArray(length); }
FREE(NativeRigidBodyArray);
GETTER(NativeRigidBodyArray, length, int) { return object->getLength(); }
OBJECT_FN(NativeRigidBodyArray, get, RigidBody)(NativeRigidBodyArray* arr, int index) { return arr->get(index); }
FN(NativeRigidBodyArray, set, void)(NativeRigidBodyArray* arr, int index, RigidBody* body) { arr->set(index, body); }