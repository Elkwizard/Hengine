#pragma once

#include "Vector.hpp"

class Ray {
	public:
		Vector origin, direction;

		Ray(const Vector& _origin, const Vector& _direction) {
			origin = _origin;
			direction = _direction.normalized();
		}

		double getDistance(const Vector& point) const {
			return dot(point - origin, direction);
		}

		Vector atDistance(double t) const {
			return origin + direction * t;
		}
};