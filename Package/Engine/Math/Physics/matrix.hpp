#pragma once

#include "vector.hpp"
#include "rigidbody.hpp"

class Matrix {
	public:
		double a, b, c, d;

		Matrix(double _a, double _b, double _c, double _d);
		Matrix(const Vector& c0, const Vector& c1);
		Matrix();
		Matrix(std::nullptr_t);

		operator bool() const;

		Matrix inverse() const;

		double determinant() const;
		Matrix operator *(const Matrix& m) const;
		Vector operator *(const Vector& v) const;
		Vector applyInverseTo(const Vector& vector) const;

		static Vector force1ToZero(const RigidBody& body, const Vector& point);
		static Vector force2ToZero(const RigidBody& bodyA, const RigidBody& bodyB, const Vector& point);
		static Vector resolveVelocityError(const RigidBody& bodyA, const RigidBody& bodyB, const Vector& error, const Vector& point);
};