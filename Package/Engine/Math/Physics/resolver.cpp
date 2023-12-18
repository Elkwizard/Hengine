#include "resolver.hpp"

CollisionResolver::CollisionResolver(PhysicsEngine& _engine) : engine(_engine) { }

double CollisionResolver::vAB(const Vector& rA, const Vector& rB, RigidBody& bodyA, RigidBody& bodyB, const Vector& normal) {
	if (bodyB.dynamic) {
		return normal.dot(
			(rB.normal() * bodyB.angularVelocity + bodyB.velocity) -
			(rA.normal() * bodyA.angularVelocity + bodyA.velocity)
		);
	}

	return -normal.dot(rA.normal() * bodyA.angularVelocity + bodyA.velocity);
}

double CollisionResolver::normalImpulse(double vAB, double mA, double mB, double iA, double iB, double e, const Vector& n, double rAx, double rAy, double rBx, double rBy) {
	double crossA = (rAx * n.y - rAy * n.x) * iA;
	double crossB = (rBx * n.y - rBy * n.x) * iB;
	double inertiaTerm = (crossA * rAx + crossB * rBx) * n.y - (crossA * rAy + crossB * rBy) * n.x;

	double invMassSum = mA + mB + inertiaTerm;
	double j = (1.0 + e) * vAB / invMassSum;
	return j;
}

std::optional<Vector> CollisionResolver::normalImpulses(double vAB1, double vAB2, double mA, double mB, double iA, double iB, double e, const Vector& n, double rA1x, double rA1y, double rB1x, double rB1y, double rA2x, double rA2y, double rB2x, double rB2y) {
	double nx = n.x;
	double ny = n.y;

	double C1 = -rB1y * iB * nx;
	double C2 = rA1y * iA * nx;
	double C3 = rB1x * iB * ny;
	double C4 = -rA1x * iA * ny;

	double C1_2 = -rB2y * iB * nx;
	double C2_2 = rA2y * iA * nx;
	double C3_2 = rB2x * iB * ny;
	double C4_2 = -rA2x * iA * ny;

	double mABx = nx * (mA + mB);
	double mABy = ny * (mA + mB);

	forceToDV.a = nx * (C1 * rB1y - C2 * rA1y + C3 * rB1y - C4 * rA1y - mABx) + ny * (-C1 * rB1x + C2 * rA1x - C3 * rB1x + C4 * rA1x - mABy);
	forceToDV.b = nx * (C1 * rB2y - C2 * rA2y + C3 * rB2y - C4 * rA2y - mABx) + ny * (-C1 * rB2x + C2 * rA2x - C3 * rB2x + C4 * rA2x - mABy);
	forceToDV.c = nx * (C1_2 * rB1y - C2_2 * rA1y + C3_2 * rB1y - C4_2 * rA1y - mABx) + ny * (-C1_2 * rB1x + C2_2 * rA1x - C3_2 * rB1x + C4_2 * rA1x - mABy);
	forceToDV.d = nx * (C1_2 * rB2y - C2_2 * rA2y + C3_2 * rB2y - C4_2 * rA2y - mABx) + ny * (-C1_2 * rB2x + C2_2 * rA2x - C3_2 * rB2x + C4_2 * rA2x - mABy);

	double dvFactor = -(1.0 + e);
	Vector dvs = Vector(vAB1, vAB2) * dvFactor;

	return forceToDV.applyInverseTo(dvs);
}

bool CollisionResolver::resolveContacts(bool dynamic, Collision& collision) {
	RigidBody& bodyA = *collision.bodyA;
	RigidBody& bodyB = *collision.bodyB;
	Vector& normal = collision.direction;
	std::vector<Vector>& contactsA = collision.contactsA;
	std::vector<Vector>& contactsB = collision.contactsB;

	Vector tangent = normal.normal();

	double staticFriction = bodyA.friction * bodyB.friction;
	double kineticFriction = staticFriction * 0.9;

	// constants
	double e = max(bodyA.restitution, bodyB.restitution);
	double mA = 1.0 / bodyA.mass;
	double iA = bodyA.canRotate ? 1.0 / bodyA.inertia : 0.0;
	double mB = dynamic ? 1.0 / bodyB.mass : 0.0;
	double iB = (dynamic && bodyB.canRotate) ? 1.0 / bodyB.inertia : 0.0;
	constexpr double GTE_EPSILON = -0.0001;

	auto solve1 = [&](const Vector& rA, const Vector& rB) {
		// radii
		auto [rAx, rAy] = rA;
		auto [rBx, rBy] = rB;

		// normal force
		double vABn = vAB(rA, rB, bodyA, bodyB, normal);
		if (vABn >= GTE_EPSILON) return false;
		double normalImpulse = this->normalImpulse(vABn, mA, mB, iA, iB, e, normal, rAx, rAy, rBx, rBy); // normal impulses are down the inverse normal
		if (normalImpulse >= GTE_EPSILON) return false;

		// friction
		double vABt = vAB(rA, rB, bodyA, bodyB, tangent);
		double jt = this->normalImpulse(vABt, mA, mB, iA, iB, 0.0, tangent, rAx, rAy, rBx, rBy);
		// this is wrong, but fairly close given precision-related compromises
		double tangentImpulse = (abs(jt) < -normalImpulse * staticFriction) ? jt : sign(jt) * -normalImpulse * kineticFriction; // normal impulses negated for absolute value

		bodyA.applyRelativeImpulse(rA, normal, normalImpulse);
		bodyA.applyRelativeImpulse(rA, tangent, tangentImpulse);

		if (dynamic) {
			bodyB.applyRelativeImpulse(rB, normal, -normalImpulse);
			bodyB.applyRelativeImpulse(rB, tangent, -tangentImpulse);
		}

		return true;
	};

	auto solve2 = [&](const Vector& rA1, const Vector& rB1, const Vector& rA2, const Vector& rB2) {
		auto [rA1x, rA1y] = rA1;
		auto [rB1x, rB1y] = rB1;
		
		auto [rA2x, rA2y] = rA2;
		auto [rB2x, rB2y] = rB2;

		// normal force
		double vAB1n = vAB(rA1, rB1, bodyA, bodyB, normal);
		double vAB2n = vAB(rA2, rB2, bodyA, bodyB, normal);

		if (vAB1n >= GTE_EPSILON || vAB2n >= GTE_EPSILON) return false;
		std::optional<Vector> normalImpulses = this->normalImpulses(vAB1n, vAB2n, mA, mB, iA, iB, e, normal, rA1x, rA1y, rB1x, rB1y, rA2x, rA2y, rB2x, rB2y); // normal impulses are down the inverse normal
		if (!normalImpulses) return false;
		auto [normalImpulse1, normalImpulse2] = *normalImpulses;
		if (normalImpulse1 >= GTE_EPSILON || normalImpulse2 >= GTE_EPSILON) return false;

		// friction (solved individually)
		double vAB1t = vAB(rA1, rB1, bodyA, bodyB, tangent);
		double vAB2t = vAB(rA2, rB2, bodyA, bodyB, tangent);
		double jt1 = this->normalImpulse(vAB1t, mA, mB, iA, iB, 0.0, tangent, rA1x, rA1y, rB1x, rB1y);
		double jt2 = this->normalImpulse(vAB2t, mA, mB, iA, iB, 0.0, tangent, rA2x, rA2y, rB2x, rB2y);
		double tangentImpulse1 = (abs(jt1) < -normalImpulse1 * staticFriction) ? jt1 : sign(jt1) * -normalImpulse1 * kineticFriction;
		double tangentImpulse2 = (abs(jt2) < -normalImpulse2 * staticFriction) ? jt2 : sign(jt2) * -normalImpulse2 * kineticFriction;

		// apply impulses
		bodyA.applyRelativeImpulse(rA1, normal, normalImpulse1);
		bodyA.applyRelativeImpulse(rA2, normal, normalImpulse2);

		bodyA.applyRelativeImpulse(rA1, tangent, tangentImpulse1);
		bodyA.applyRelativeImpulse(rA2, tangent, tangentImpulse2);

		if (dynamic) {
			bodyB.applyRelativeImpulse(rB1, normal, -normalImpulse1);
			bodyB.applyRelativeImpulse(rB2, normal, -normalImpulse2);
			bodyB.applyRelativeImpulse(rB1, tangent, -tangentImpulse1);
			bodyB.applyRelativeImpulse(rB2, tangent, -tangentImpulse2);
		}

		return true;
	};

	bool anySolved = false;

	int contacts = contactsA.size();

	for (int i = 0; i < contacts; i += 2) {
		if (i + 1 < contacts) {
			Vector& rA1 = contactsA[i];
			Vector& rB1 = contactsB[i];
			Vector& rA2 = contactsA[i + 1];
			Vector& rB2 = contactsB[i + 1];
			if (!solve2(rA1, rB1, rA2, rB2)) {
				if (!anySolved) anySolved = solve1(rA1, rB1);
				if (!anySolved) anySolved = solve1(rA2, rB2);
			} else if (contacts == 2) return false;
		} else {
			if (!anySolved)	anySolved = solve1(contactsA[i], contactsB[i]);
			if (contacts == 1) return false;
		}
	}

	return anySolved;
}

void CollisionResolver::resolveAllContacts() {
	for (int i = 0; i < engine.contactIterations; i++) {
		engine.orderGenerator.shuffle(dynamicCollisions);
		for (std::unique_ptr<Collision>& collision : dynamicCollisions)
			resolveContacts(true, *collision);
		
		engine.orderGenerator.shuffle(staticCollisions);
		for (std::unique_ptr<Collision>& collision : staticCollisions)
			resolveContacts(true, *collision);
	}

	dynamicCollisions.clear();
	staticCollisions.clear();
}

void CollisionResolver::resolve(bool dynamic, bool prohibited, std::unique_ptr<Collision>& collision) {
	RigidBody& bodyA = *collision->bodyA;
	RigidBody& bodyB = *collision->bodyB;
	Vector direction = collision->direction;
	double penetration = collision->penetration;
	
	// penetration *= 0.2;
	constexpr double SLOP = 0.05;
	
	dynamic = dynamic && !prohibited;

	(dynamic ? dynamicCollisions : staticCollisions).push_back(std::move(collision));

	if (penetration > SLOP) {
		penetration -= SLOP;
		if (dynamic) {
			double portionA = bodyB.mass / (bodyA.mass + bodyB.mass);
			double portionB = (1 - portionA);
			Vector moveA = direction * (-portionA * penetration);
			Vector moveB = direction * (portionB * penetration);
			
			bodyA.displace(moveA);
			bodyB.displace(moveB);
		} else {
			bodyA.displace(direction * -penetration);
		}
	}
}