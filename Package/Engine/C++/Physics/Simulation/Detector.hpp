#pragma once

#include "Collision.hpp"
#include "../../Math/Shadow.hpp"
#include "RigidBody.hpp"
#include "../../Util/Timer.hpp"

#include <memory>

API class Detector {
	private:
		static std::optional<Collision> collideBallBall(const Shape& shapeA, const Shape& shapeB) {
			const Ball& a = (const Ball&)shapeA;
			const Ball& b = (const Ball&)shapeB;

			Vector diff = b.position - a.position;
			double radii = a.radius + b.radius;
			double sqrMag = diff.sqrMag();

			if (sqrMag > radii * radii) return { };
			
			double mag = std::sqrt(sqrMag);
			double penetration = radii - mag;
			diff /= mag;
			Vector contact = a.position + diff * (a.radius - penetration * 0.5);

			return Collision(diff, penetration, { contact });
		}
		
		static std::optional<Collision> collideBallPolytope(const Shape& shapeA, const Shape& shapeB) {
			const Ball& a = (const Ball&)shapeA;
			const Polytope& b = (const Polytope&)shapeB;

			double bestDist = INFINITY;
			std::optional<Vector> bestPoint;
			
			Vector pA = a.position;

			for (int i = 0; i < b.getFaceCount(); i++) {
				Vector candidate = b.getFace(i).closestPointTo(pA);
	
				double dist = (candidate - pA).sqrMag();
				if (dist < bestDist) {
					bestDist = dist;
					bestPoint = candidate;
				}
			}
			
			if (bestPoint) {
				Vector between = *bestPoint - a.position;
				bestDist = std::sqrt(bestDist);
				Vector axis = between.normalized();

				Vector toB = a.position - b.position;
				bool inside = dot(toB, axis) > 0.0;

				if (bestDist > a.radius && !inside) return { };

				if (inside) {
					axis = -axis;
					bestDist = bestDist + a.radius;
				} else bestDist = a.radius - bestDist;

				if (!bestDist) return { };
				return Collision(axis, bestDist, { *bestPoint });
			}

			return { };
		}

		static void clipEdge(
			std::vector<Vector>& contacts, const Line& subject,
			const Polytope& clip, const Plane& separator
		) {
			Vector a = subject.start;
			Vector b = subject.end;
			Vector vec = subject.vector();

			if (
				dot(separator.normal, a) < separator.distance &&
				dot(separator.normal, b) < separator.distance
			) return;
			
			for (const Plane& plane : clip.planes) {
				double dotA = dot(a, plane.normal);
				bool keepA = dotA > plane.distance;
				
				double dotB = dot(b, plane.normal);
				bool keepB = dotB > plane.distance;

				if (keepA == keepB || equals(dotA, dotB)) {
					if (!keepA) return;
				} else {
					double t = (plane.distance - dotA) / dot(plane.normal, vec);
					Vector intersect = a + vec * t;
					(keepA ? b : a) = intersect;
				}
			}

			contacts.push_back(Line(a, b).midpoint());
		}

		static void clipVertex(
			std::vector<Vector>& contacts, const Vector& subject,
			const Polytope& clip, const Plane& separator
		) {
			if (dot(separator.normal, subject) < separator.distance) return;

			for (const Plane& face : clip.planes)
				if (dot(face.normal, subject) < face.distance)
					return;

			contacts.push_back(subject);
		}

		static bool checkAxis(
			const Polytope& a, const Polytope& b,
			const Vector& axis, double& minOverlap,
			Vector& bestAxis
		) {
			double aMax = a.getMaxExtent(axis);
			double bMin = b.getMinExtent(axis);
			double overlap = aMax - bMin;
			
			if (overlap < minOverlap) {
				if (overlap < 0) {
					a.collisionCache.insert_or_assign(&b, axis);
					return true;
				}

				minOverlap = overlap;
				bestAxis = axis;
			}

			return false;
		}
		
		static std::optional<Collision> collidePolytopePolytope(const Shape& shapeA, const Shape& shapeB) {
			const Polytope& a = (const Polytope&)shapeA;
			const Polytope& b = (const Polytope&)shapeB;

			if (a.collisionCache.count(&b)) {
				Vector axis = a.collisionCache.at(&b);
				if (a.getMaxExtent(axis) < b.getMinExtent(axis))
					return { };
			}

			Vector toB = b.position - a.position;

			double minOverlap = INFINITY;
			Vector bestAxis;

			for (const Plane& p : a.planes)
				if (dot(p.normal, toB) < 0.0)
					if (checkAxis(a, b, -p.normal, minOverlap, bestAxis))
						return { };

			for (const Plane& p : b.planes)
				if (dot(p.normal, toB) >= 0.0)
					if (checkAxis(a, b, p.normal, minOverlap, bestAxis))
						return { };

#if IS_3D
			for (const Vector& axisA : a.edgeAxes)
			for (const Vector& axisB : b.edgeAxes) {
				Vector axis = cross(axisA, axisB);
				if (!axis) continue;

				axis.normalize();
				if (dot(axis, toB) < 0) axis = -axis;
				if (checkAxis(a, b, axis, minOverlap, bestAxis))
					return { };
			}
#endif

			if (minOverlap == INFINITY) return { };

			Vector normal = bestAxis;

			std::vector<Vector> contacts;
			
			Plane collisionPlaneA { -normal, -a.getMaxExtent(normal) };
			Plane collisionPlaneB { normal, b.getMinExtent(normal) };

			for (int i = 0; i < a.vertices.size(); i++)
				clipVertex(contacts, a.vertices[i], b, collisionPlaneB);

			for (int i = 0; i < b.vertices.size(); i++)
				clipVertex(contacts, b.vertices[i], a, collisionPlaneA);
			
			if (contacts.empty()) {
#if IS_3D
				if (contacts.empty()) {
					for (int i = 0; i < a.getEdgeCount() && contacts.empty(); i++)
						clipEdge(contacts, a.getEdge(i), b, collisionPlaneB);
					
					if (contacts.empty()) {
						for (int i = 0; i < b.getEdgeCount() && contacts.empty(); i++)
							clipEdge(contacts, b.getEdge(i), a, collisionPlaneA);
					}
				}
#endif
			}

			return Collision(normal, minOverlap, contacts);
		}
		
		static std::optional<Collision> collidePolytopeBall(const Shape& shapeA, const Shape& shapeB) {
			std::optional<Collision> result = collideBallPolytope(shapeB, shapeA);
			if (result) result->invert();
			return result;
		}

		using CollideTest = std::optional<Collision>(*)(const Shape&, const Shape&);
		constexpr static CollideTest typePairTable[Shape::COUNT][Shape::COUNT] = {
			{ // Ball
				collideBallBall, // Ball
				collideBallPolytope // Polytope
			},
			{ // Polytope
				collidePolytopeBall, // Ball
				collidePolytopePolytope // Polytope
			}
		};

	public:
		API static bool testCollide(const Shape& a, const Shape& b) {
			return !!collide(a, b);
		}

		static std::optional<Collision> collide(const Shape& a, const Shape& b) {
			return typePairTable[a.type][b.type](a, b);
		}

		static std::optional<Collision> collideBodies(const RigidBody& bodyA, const RigidBody& bodyB) {
			if (!bodyA.bounds.intersects(bodyB.bounds))
				return { };
			
			int aShapes = bodyA.getShapeCount();
			int bShapes = bodyB.getShapeCount();
			if (aShapes == 1 && bShapes == 1) {
				return collide(bodyA.getShape(0), bodyB.getShape(0));
			} else {
				std::vector<Collision> collisions { };
				for (int i = 0; i < aShapes; i++)
				for (int j = 0; j < bShapes; j++) {
					std::optional<Collision> col = collide(bodyA.getShape(i), bodyB.getShape(j));
					if (col) collisions.push_back(*col);
				}
				if (!collisions.size()) return { };
				
				std::vector<Vector> contacts { };
				Vector dir { };
				double penetration = -INFINITY;
				Collision* best;

				for (int i = 0; i < collisions.size(); i++)
					dir += collisions[i].normal;

				for (int i = 0; i < collisions.size(); i++) {
					Collision& col = collisions[i];
					if (dot(col.normal, dir) < 0.0) continue;
					contacts.insert(contacts.end(), col.contacts.begin(), col.contacts.end());
					if (col.penetration > penetration) {
						penetration = col.penetration;
						best = &col;
					}
				}

				if (!contacts.size()) return { };

				best->contacts = contacts;
				dir.normalize();
				best->penetration *= dot(best->normal, dir);
				best->normal = dir;

				return *best;
			}
		}
};