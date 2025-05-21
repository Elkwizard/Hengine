#pragma once

#include "../../Math/Vector.hpp"
#include "RigidBody.hpp"

class Collision {
	public:
		Vector normal;
		double penetration;
		std::vector<Vector> contacts;
		bool dynamic;

		Collision(const Vector& _normal, double _penetration, const std::vector<Vector>& _contacts) {
			normal = _normal;
			penetration = _penetration;
			contacts = _contacts;
		}

		void invert() {
			normal = -normal;
		}
};