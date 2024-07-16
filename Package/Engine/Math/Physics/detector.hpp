#pragma once

#include <unordered_map>
#include <functional>

#include "rigidbody.hpp"

class PhysicsMath {
	public:
		static std::optional<Vector> intersectLine(
			const Vector& a0, const Vector& b0,
			const Vector& a1, const Vector& b1
		) {
			Vector o0 = a0;
			Vector v0 = b0 - a0;
			Vector o1 = a1;
			Vector v1 = b1 - a1;
			Matrix mat { v0, -v1 };
			std::optional<Vector> ts = mat.applyInverseTo(o1 - o0);

			if (!ts) return { };

			auto [t, s] = *ts;

			if (t < 0.0 || t > 1.0) return { };
			if (s < 0.0 || s > 1.0) return { };

			return o0 + v0 * t;
		}

		static std::vector<Vector> intersectPolygon(
			const std::vector<Vector>& a,
			const std::vector<Vector>& b,
			int maxMatches = std::numeric_limits<int>::max()
		) {
			std::vector<Vector> points { };

			Vector last = { NAN, NAN };

			for (int i = 0; i < a.size(); i++)
			for (int j = 0; j < b.size(); j++) {
				std::optional<Vector> p = intersectLine(
					a[i], a[(i + 1) % a.size()],
					b[j], b[(j + 1) % b.size()]
				);
				if (p && *p != last) {
					last = *p;
					points.push_back(last);
					if (points.size() == maxMatches)
						return points;
				}
			}

			return points;
		}
};

class Collision {
	public:
		RigidBody* bodyA;
		RigidBody* bodyB;
		std::vector<Vector> contacts, contactsA, contactsB;
		double penetration;
		Vector direction;

		Collision() { }

		Collision(const Vector& _direction, const std::vector<Vector>& _contacts, double _penetration) {
			bodyA = nullptr;
			bodyB = nullptr;
			direction = _direction;
			contacts = _contacts;
			penetration = _penetration;
		}
		
		void setBodies(RigidBody& _bodyA, RigidBody& _bodyB) {
			bodyA = &_bodyA;
			bodyB = &_bodyB;
			contactsA = contacts;
			contactsB = contacts;
			for (int i = 0; i < contacts.size(); i++) {
				contactsA[i] -= bodyA->position;
				contactsB[i] -= bodyB->position;
			}
		}
};

class CollisionDetector {
	public:
		using JumpTable = std::unordered_map<Collider::Type, std::unordered_map<Collider::Type, std::function<std::unique_ptr<Collision>(Model*, Model*)>>>;
		static JumpTable jumpTable;

		static std::unique_ptr<Collision> collideBodies(RigidBody& bodyA, RigidBody& bodyB) {
			if (bodyA.shapes.size() == 1 && bodyB.shapes.size() == 1) {
				std::unique_ptr<Collision> collision = CollisionDetector::collide(
					bodyA.shapes[0], bodyA.position, bodyA.cosAngle, bodyA.sinAngle,
					bodyB.shapes[0], bodyB.position, bodyB.cosAngle, bodyB.sinAngle
				);

				if (collision)
					collision->setBodies(bodyA, bodyB);

				return collision;
			} else {
				std::vector<std::unique_ptr<Collision>> collisions { };
				for (int i = 0; i < bodyA.shapes.size(); i++)
				for (int j = 0; j < bodyB.shapes.size(); j++) {
					std::unique_ptr<Collision> col = CollisionDetector::collide(
						bodyA.shapes[i], bodyA.position, bodyA.cosAngle, bodyA.sinAngle,
						bodyB.shapes[j], bodyB.position, bodyB.cosAngle, bodyB.sinAngle
					);
					if (col) collisions.push_back(std::move(col));
				}
				if (!collisions.size()) return nullptr;
				
				std::vector<Vector> contacts { };
				Vector dir { };
				double penetration = -INFINITY;
				std::unique_ptr<Collision> best;

				for (int i = 0; i < collisions.size(); i++)
					dir += collisions[i]->direction;

				for (int i = 0; i < collisions.size(); i++) {
					std::unique_ptr<Collision>& col = collisions[i];
					if (col->direction.dot(dir) < 0.0) continue;
					contacts.insert(contacts.end(), col->contacts.begin(), col->contacts.end());
					if (col->penetration > penetration) {
						penetration = col->penetration;
						best = std::move(col);
					}
				}

				if (!contacts.size()) return nullptr;

				best->contacts = contacts;
				dir.normalize();
				double dot = best->direction.dot(dir);
				best->penetration *= dot;
				best->direction = dir;

				// assign bodies
				best->setBodies(bodyA, bodyB);
				return best;
			}
		}

		static std::unique_ptr<Collision> collide(
			Collider* shapeA, const Vector& posA, double cosA, double sinA,
			Collider* shapeB, const Vector& posB, double cosB, double sinB
		) {
			Vector d = posB - posA;
			if (d.sqrMag() > pow(shapeA->boundingRadius + shapeB->boundingRadius, 2))
				return nullptr;

			return CollisionDetector::jumpTable[shapeA->type][shapeB->type](
				shapeA->cacheModel(posA, cosA, sinA),
				shapeB->cacheModel(posB, cosB, sinB)
			);
		}

		static std::unique_ptr<Collision> CircleModel_PolygonModel(Model* _a, Model* _b) {
			CircleModel& a = *(CircleModel*)_a;
			PolygonModel& b = *(PolygonModel*)_b;

			double bestDist = INFINITY;
			std::optional<Vector> bestPoint;
			
			Vector pA = a.position;

			for (int i = 0; i < b.vertices.size(); i++) {
				Vector& start = b.vertices[i];
				Vector& end = b.vertices[(i + 1) % b.vertices.size()];

				Vector v = end - start;
				float t = (pA - start).dot(v) / v.sqrMag();
				Vector submission = start + v * clamp(t, 0.0, 1.0);

				double dist = (submission - pA).sqrMag();
				if (dist < bestDist) {
					bestDist = dist;
					bestPoint = submission;
				}
			}
			
			if (bestPoint) {
				Vector between = *bestPoint - a.position;
				bestDist = sqrt(bestDist);
				Vector axis = between.normalized();

				Vector toB = a.position - b.position;
				bool inside = toB.dot(axis) > 0.0;

				if (bestDist > a.radius && !inside) return nullptr;

				if (inside) {
					axis = -axis;
					bestDist = bestDist + a.radius;
				} else bestDist = a.radius - bestDist;

				if (!bestDist) return nullptr;
				return std::make_unique<Collision>(axis, std::vector<Vector>({ *bestPoint }), bestDist);
			}

			return nullptr;
		}

		static std::unique_ptr<Collision> PolygonModel_CircleModel(Model* a, Model* b) {
			std::unique_ptr<Collision> col = CollisionDetector::CircleModel_PolygonModel(b, a);
			if (col) col->direction = -col->direction;
			return col;
		}

		static std::unique_ptr<Collision> CircleModel_CircleModel(Model* _a, Model* _b) {
			CircleModel& a = *(CircleModel*)_a;
			CircleModel& b = *(CircleModel*)_b;

			Vector between = b.position - a.position;
			double sqrMag = between.sqrMag();
			if (sqrMag < pow(a.radius + b.radius, 2)) {
				double mag = sqrt(sqrMag);
				Vector axis = between / mag;
				Vector point = (a.position + b.position + axis * (a.radius - b.radius)) * 0.5;
				return std::make_unique<Collision>(axis, std::vector<Vector>({ point }), a.radius + b.radius - mag);
			}
			return nullptr;
		}

		static std::unique_ptr<Collision> PolygonModel_PolygonModel(Model* _a, Model* _b) {
			PolygonModel& a = *(PolygonModel*)_a;
			PolygonModel& b = *(PolygonModel*)_b;

			Vector toB = b.position - a.position;

			std::vector<Vector> axes { };
			for (const Vector& ax : a.axes)
				if (ax.dot(toB) <= 0.0) axes.push_back(-ax);
			
			for (const Vector& ax : b.axes)
				if (ax.dot(toB) > 0.0) axes.push_back(ax);
			
			if (axes.empty()) return nullptr;

			double minOverlap = INFINITY;
			std::optional<Vector> bestAxis;

			for (const Vector& axis : axes) {
				double aMin = INFINITY;
				double aMax = -INFINITY;
				double bMin = INFINITY;
				double bMax = -INFINITY;

				for (const Vector& p : a.vertices) {
					double dot = p.dot(axis);
					if (dot < aMin) aMin = dot;
					if (dot > aMax) aMax = dot;
				}

				for (const Vector& p : b.vertices) {
					double dot = p.dot(axis);
					if (dot < bMin) bMin = dot;
					if (dot > bMax) bMax = dot;
				}

				if (aMax < bMin || aMin > bMax)
					return nullptr;

				double overlap = (aMin + aMax < bMin + bMax) ? aMax - bMin : bMax - aMin;
				if (overlap < minOverlap) {
					minOverlap = overlap;
					bestAxis = axis;
				}
			}

			if (!bestAxis) return nullptr;

			std::vector<Vector> contacts = PhysicsMath::intersectPolygon(a.vertices, b.vertices, 2);

			return std::make_unique<Collision>(*bestAxis, contacts, minOverlap);
		}
};

CollisionDetector::JumpTable CollisionDetector::jumpTable {
    { Collider::POLYGON, {
        { Collider::POLYGON, CollisionDetector::PolygonModel_PolygonModel },
        { Collider::CIRCLE, CollisionDetector::PolygonModel_CircleModel }
    } },
    { Collider::CIRCLE, {
        { Collider::POLYGON, CollisionDetector::CircleModel_PolygonModel },
        { Collider::CIRCLE, CollisionDetector::CircleModel_CircleModel }
    } }
};

STATIC_FN(CollisionDetector, collide, bool)(Collider* a, Collider* b) {
	return (bool)CollisionDetector::collide(a, { }, 1.0, 0.0, b, { }, 1.0, 0.0);
}