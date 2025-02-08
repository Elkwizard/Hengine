#pragma once

#include <functional>

class RigidBody;

#include "global.hpp"
#include "colliders.hpp"
#include "engine.hpp"
#include "constraints.hpp"

API_IMPORT bool collideRule(const RigidBody&, const RigidBody&);
API_IMPORT bool triggerRule(const RigidBody&, const RigidBody&);

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

API class RigidBody {
	public:
		API ID id;

		API Vector position;
		API double angle;
		Vector lastPosition;
		double lastAngle;
		double cosAngle, sinAngle;

		API Vector velocity;
		API double angularVelocity;

		API double mass, inertia, density;
		API_CONST double boundingRadius;
		Bounds bounds;

		API double restitution;
		API double friction;

		API bool canRotate, dynamic, simulated, airResistance, gravity, isTrigger, canCollide;

		PhysicsEngine* engine;

		using Filter = std::function<bool (const RigidBody&)>;

		API bool trivialCollisionFilter, trivialTriggerFilter;
		Filter collisionFilter, triggerFilter;

		std::vector<Vector> prohibitedDirections { };

		std::vector<Collider*> shapes { };
		API std::vector<Constraint*> constraints { };

		API RigidBody(double x, double y, bool _dynamic);
		~RigidBody();

		bool canCollideWith(const RigidBody& body) const;
		bool isTriggerWith(const RigidBody& body) const;
		bool isProhibited(const Vector& direction) const;
		void prohibit(const Vector& direction);
		API void setDensity(double a);
		API void setAngle(double a);
		void updateLastData();
		void displace(const Vector& v);
		API void invalidateModels();
		Model* getModel(int i);
		std::vector<Model*> getModels();
		Model* cacheModel(int i);
		std::vector<Model*> cacheModels();
		API void clearShapes();
		API void removeShape(Collider* shape);
		API void addShape(Collider* shape);
		API void stop();
		void integrate(double intensity);
		void integratePosition(double intensity);
		Vector pointVelocity(const Vector& p) const;
		Vector pointForce(const Vector& p) const;
		API void applyImpulse(const Vector& pos, const Vector& imp, double factor = 1.0);
		API void applyRelativeImpulse(const Vector& pos, const Vector& imp, double factor = 1.0);

		API static RigidBody* fromPolygon(std::vector<Vector> vertices, bool dynamic = true);
		API static RigidBody* fromRect(double x, double y, double w, double h, bool dynamic = true);
		API static RigidBody* fromCircle(double x, double y, double r, bool dynamic = true);
};

API using Bodies = std::vector<RigidBody*>;