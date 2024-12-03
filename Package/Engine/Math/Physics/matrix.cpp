#include "matrix.hpp"

Matrix::Matrix(double _a, double _b, double _c, double _d) {
	a = _a;
	b = _b;
	c = _c;
	d = _d;
}

Matrix::Matrix(const Vector& c0, const Vector& c1) {
	a = c0.x;
	b = c1.x;
	c = c0.y;
	d = c1.y;
}

Matrix::Matrix() {
	a = 1.0;
	b = 0.0;
	c = 0.0;
	d = 1.0;
}

std::optional<Matrix> Matrix::inverse() const {
	double det = determinant();
	if (!det) return { };
	double invDeterminant = 1.0 / det;
	return Matrix(
		invDeterminant * d, invDeterminant * -b,
		invDeterminant * -c, invDeterminant * a
	);
}

double Matrix::determinant() const {
	return a * d - b * c;
}

Matrix Matrix::operator*(const Matrix& m) const {
	return {
		a * m.a + b * m.c, a * m.b + b * m.d,
		c * m.a + d * m.c, c * m.b + d * m.d
	};
}

Vector Matrix::operator *(const Vector& v) const {
	return { a * v.x + b * v.y, c * v.x + d * v.y };
}

std::optional<Vector> Matrix::applyInverseTo(const Vector& vector) const {
	double det = determinant();
	if (!det) return { };

	double invDeterminant = 1.0 / det;
	double a = this->d;
	double b = -this->b;
	double c = -this->c;
	double d = this->a;

	return Vector(
		invDeterminant * (a * vector.x + b * vector.y),
		invDeterminant * (c * vector.x + d * vector.y)
	);
}

Vector Matrix::force1ToZero(const RigidBody& body, const Vector& point) {
	if (!body.dynamic) return { };

	double mA = 1 / body.mass;
	double iA = body.canRotate ? 1 / body.inertia : 0;
	double rAx = point.x - body.position.x;
	double rAy = point.y - body.position.y;

	// construct force-to-velocity matrix
	double a = -mA - iA * pow(rAy, 2);
	double b = iA * rAx * rAy;
	double c = b;
	double d = -mA - iA * pow(rAx, 2);

	double determinant = a * d - b * c;

	// non-invertable matrix, I really don't know what to do here
	if (!determinant) return { };

	double invDeterminant = 1.0 / determinant;

	// invert to get velocity-to-force matrix (save dividing by determinant for later)
	double inverseA = d;
	double inverseB = -b;
	double inverseC = -c;
	double inverseD = a;

	double velocityX = -rAy * body.angularVelocity + body.velocity.x;
	double velocityY = rAx * body.angularVelocity + body.velocity.y;

	return {
		invDeterminant * (inverseA * velocityX + inverseB * velocityY),
		invDeterminant * (inverseC * velocityX + inverseD * velocityY)
	};
}

Vector Matrix::force2ToZero(const RigidBody& bodyA, const RigidBody& bodyB, const Vector& point) {
	double rAx = point.x - bodyA.position.x;
	double rAy = point.y - bodyA.position.y;
	double rBx = point.x - bodyB.position.x;
	double rBy = point.y - bodyB.position.y;
	Vector velocityError {
		(-rAy * bodyA.angularVelocity + bodyA.velocity.x) - (-rBy * bodyB.angularVelocity + bodyB.velocity.x),
		(rAx * bodyA.angularVelocity + bodyA.velocity.y) - (rBx * bodyB.angularVelocity + bodyB.velocity.y)
	};
	return Matrix::resolveVelocityError(bodyA, bodyB, velocityError, point);
}

Vector Matrix::resolveVelocityError(const RigidBody& bodyA, const RigidBody& bodyB, const Vector& error, const Vector& point) {
	bool dynamicA = bodyA.dynamic;
	bool dynamicB = bodyB.dynamic;

	if (dynamicA || dynamicB) {
		double mA = dynamicA ? 1.0 / bodyA.mass : 0.0;
		double mB = dynamicB ? 1.0 / bodyB.mass : 0.0;
		double iA = dynamicA && bodyA.canRotate ? 1.0 / bodyA.inertia : 0.0;
		double iB = dynamicB && bodyB.canRotate ? 1.0 / bodyB.inertia : 0.0;
		double rAx = point.x - bodyA.position.x;
		double rAy = point.y - bodyA.position.y;
		double rBx = point.x - bodyB.position.x;
		double rBy = point.y - bodyB.position.y;

		// construct force-to-velocity matrix
		double a = -(mA + iA * pow(rAy, 2) + mB + iB * pow(rBy, 2));
		double b = iA * rAx * rAy + iB * rBx * rBy;
		double c = b;
		double d = -(mA + iA * pow(rAx, 2) + mB + iB * pow(rBx, 2));

		double determinant = a * d - b * c;

		// non-invertable matrix, I really don't know what to do here
		if (!determinant) return { };

		double invDeterminant = 1.0 / determinant;

		// invert to get velocity-to-force matrix (save dividing by determinant for later)
		double inverseA = invDeterminant * d;
		double inverseB = invDeterminant * -b;
		double inverseC = invDeterminant * -c;
		double inverseD = invDeterminant * a;

		double velocityX = error.x;
		double velocityY = error.y;

		return {
			inverseA * velocityX + inverseB * velocityY,
			inverseC * velocityX + inverseD * velocityY
		};
	}
	return { };
}
