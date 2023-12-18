#pragma once

#include "engine.hpp"
#include "detector.hpp"
#include "matrix.hpp"

class CollisionResolver {
	private:
		PhysicsEngine& engine;
		std::vector<std::unique_ptr<Collision>> dynamicCollisions { }, staticCollisions { };
		Matrix forceToDV { };

		double vAB(const Vector& rA, const Vector& rB, RigidBody& bodyA, RigidBody& bodyB, const Vector& normal);
		double normalImpulse(double vAB, double mA, double mB, double iA, double iB, double e, const Vector& n, double rAx, double rAy, double rBx, double rBy);
		std::optional<Vector> normalImpulses(double vAB1, double vAB2, double mA, double mB, double iA, double iB, double e, const Vector& n, double rA1x, double rA1y, double rB1x, double rB1y, double rA2x, double rA2y, double rB2x, double rB2y);
		bool resolveContacts(bool dynamic, Collision& collision);

	public:
		CollisionResolver(PhysicsEngine& _engine);

		void resolveAllContacts();
		void resolve(bool dynamic, bool prohibited, std::unique_ptr<Collision>& collision);
};