#pragma once

#include <unordered_set>

#include "../Math/Transform.hpp"
#include "Shape.hpp"
#include "Matter.hpp"

class RigidBody;

API_IMPORT bool triggerRule(const RigidBody&, const RigidBody&);
API_IMPORT bool collisionRule(const RigidBody&, const RigidBody&);

template<>
class std::hash<RigidBody*> {
	public:
		size_t operator ()(RigidBody* ptr) const {
			return (size_t)ptr >> 3;
		}
};

template<typename L, typename R>
class std::hash<std::pair<L, R>> {
	private:
		std::hash<L> left;
		std::hash<R> right;

	public:
		size_t operator ()(const std::pair<L, R>& pair) const {
			return left(pair.first) ^ right(pair.second);
		}
};

class RayHit {
	public:
		RigidBody* body;
		double distance;

		RayHit(RigidBody* _body, double _distance) {
			body = _body;
			distance = _distance;
		}

		RayHit() {
			distance = -1;
		}

		bool present() const {
			return distance > 0;
		}

		void add(const RayHit& info) {
			if (!present() || (info.present() && info.distance < distance))
				*this = info;
		}
};

using Derivative = Transform RigidBody::*;

class ConstraintDescriptor;

API class RigidBody {
	private:
		class Collider {
			private:
				std::unique_ptr<Shape> local;
				mutable std::unique_ptr<Shape> global;
				mutable bool valid = false;
				
			public:
				AABB bounds;
				
				Collider(Shape* _local) {
					local = std::unique_ptr<Shape>(_local);
					global = std::unique_ptr<Shape>(local->copy());
				}
		
				bool operator ==(Shape* other) const {
					return local.get() == other;
				}
		
				void invalidate() {
					valid = false;
				}
		
				void updateBounds(bool dynamic, const Transform& transf) {
					global->sync(*local, transf);
					bounds = dynamic ? global->getBallBounds() : global->getBounds();
					valid = false;
				}
		
				Shape& cache(const Transform& transform) const {
					if (!valid) {
						valid = true;
						global->sync(*local, transform);
					}
					return *global;
				}

				friend std::ostream& operator <<(std::ostream& out, const Collider& collider) {
					out << *collider.local;
					return out;
				}
		};
		
		class Prohibited {
			private:
			
			public:
			std::vector<Vector> prohibited;
				Prohibited() { }
		
				void clear() {
					prohibited.clear();
				}
		
				void add(const Vector& dir) {
					prohibited.push_back(dir);
				}
				
				bool has(const Vector& dir) const {
					return (bool)match(dir);
				}

				std::optional<Vector> match(const Vector& dir) const {
					for (const Vector& wrong : prohibited)
						if (dot(wrong, dir) > 0.8)
							return wrong;
					return { };
				}
		};
	
		bool dynamic;
		double density = 1;
		std::vector<Collider> colliders;
		Transform lastPosition;
		Orientation lastBoundedOrientation;

		void syncMatter() {
			if (dynamic && canRotate) {
				matter = localMatter.rotate(position.orientation);
			} else {
				matter.mass = dynamic ? localMatter.mass : INFINITY;
				matter.inertia = INFINITY;
				matter.computeInverses();
			}
		}

		void invalidateColliders() {
			for (Collider& collider : colliders)
				collider.invalidate();
			bounds = localBounds + position.linear;
		}

		void updateLocalBounds() {
			lastBoundedOrientation = position.orientation;
			localBounds = { };
			Transform orientationOnly = { { }, position.orientation };
			for (Collider& collider : colliders) {
				collider.updateBounds(dynamic, orientationOnly);
				localBounds.add(collider.bounds);
			}
		}

		void modifyShapes() {
			updateLocalBounds();
			syncMatter();
		}

	public:
		API_CONST Transform position;
		API_CONST Transform velocity;

		API int name;
		size_t wave;
		
		Matter localMatter, matter;
		AABB localBounds, bounds;
		
		Prohibited prohibited;
		API_CONST std::vector<ConstraintDescriptor*> constraintDescriptors;
		
		API bool simulated = true;
		API bool gravity = true;
		API bool drag = true;

		API double restitution = 0;
		API double friction = 0.5;
		API bool canRotate = true;
		
		// trigger
		API bool isTrigger = false;
		API bool trivialTriggerRule = true;
		
		// collide
		API bool canCollide = true;
		API bool trivialCollisionRule = true;

		RigidBody(const Transform& _position, bool _dynamic)
		: RigidBody(_dynamic) {
			position = _position;
		}

		API RigidBody(bool _dynamic) {
			dynamic = _dynamic;
		}

		API std::vector<Vector> getProhibitedDirections() const {
			return prohibited.prohibited;
		}

		API void setDynamic(bool _dynamic) {
			dynamic = _dynamic;
			updateLocalBounds();
			syncMatter();
		}

		API bool getDynamic() const {
			return dynamic;
		}

		API void setDensity(double _density) {
			localMatter *= _density / density;
			syncMatter();
			density = _density;
		}

		API double getDensity() const {
			return density;
		}

		API double getMass() {
			return localMatter.mass;
		}

		API Inertia getInertia() {
			return localMatter.rotate(position.orientation).inertia;
		}

		API void addShape(Shape* shape) {
			localMatter += shape->getMatter() * density;
			colliders.emplace_back(shape);
			modifyShapes();
		}
		
		API void removeShape(Shape* shape) {
			localMatter -= shape->getMatter() * density;
			erase(colliders, shape);
			modifyShapes();
		}
		
		API void removeAllShapes() {
			localMatter = { };
			colliders.clear();
			modifyShapes();
		}

		API double getKineticEnergy() const {
			double K = 0.5 * localMatter.mass * velocity.linear.sqrMag();
#if IS_3D
			Vector rotation = velocity.orientation.getRotation();
			double omega = rotation.mag();
			Vector axis = rotation / omega;
			K += 0.5 * dot(axis, matter.inertia * axis) * std::pow(omega, 2);
#else
			K += 0.5 * matter.inertia * std::pow(velocity.orientation.getRotation(), 2);
#endif
			return K;
		}

		bool isTriggerWith(const RigidBody& other) const {
			return !trivialTriggerRule && triggerRule(*this, other);
		}

		bool canCollideWith(const RigidBody& other) const {
			return trivialCollisionRule || collisionRule(*this, other);
		}

		int getShapeCount() const {
			return colliders.size();
		}

		const Shape& getShape(int index) const {
			return colliders[index].cache(position);
		}
		
		Vector getPointVelocity(const Vector& offset) const {
			return velocity.linear + IF_3D(
				cross(velocity.orientation.getRotation(), offset),
				offset.normal() * velocity.orientation.getRotation()
			);
		}

		void recomputeVelocity(double dt) {
			velocity = (position - lastPosition) * (1.0 / dt);
		}

		template <Derivative D>
		void applyRelativeImpulse(const Vector& offset, const Vector& imp) {
			Vector linearDelta = matter.invMass * imp;
			
			(this->*D).linear += linearDelta;

			if (canRotate) {
				Cross torque = cross(offset, imp);
				ONLY_2D(if (torque)) (this->*D).orientation += Orientation(matter.invInertia * torque);
			}
		}

		API void applyImpulse(const Vector& pos, const Vector& imp) {
			if (!dynamic) return;
			applyRelativeImpulse<&RigidBody::velocity>(pos - position.linear, imp);
		}

		void cache() {
			if (lastBoundedOrientation != position.orientation && !dynamic)
				updateLocalBounds();
			
			sync();
		}

		void sync() {
			syncMatter();
			invalidateColliders();
		}

		void integrate(double dt) {
			lastPosition = position;
			
			// motion
			if (canRotate) {
#if IS_3D
				// precession
				// Orientation next = position.orientation + velocity.orientation;
				// Inertia invInertia = localMatter.rotate(next).invInertia;
				// velocity.orientation = Orientation(
				// 	invInertia * matter.inertia * velocity.orientation.getRotation()
				// );
#endif
			} else {
				velocity.orientation = { };
			}

			position += velocity * dt;
			sync();
		}

		RayHit raycast(const Ray& ray) const {
			RayHit best;

			for (int i = 0; i < getShapeCount(); i++) {
				double dist = getShape(i).raycast(ray);
				best.add({ (RigidBody*)this, dist });
			}

			return best;
		}

		friend std::ostream& operator <<(std::ostream& out, const RigidBody& body) {
			out << "{ position: " << body.position << " | velocity: " << body.velocity << " | shapes: " << body.colliders << " }";
			return out;
		} 
		friend std::ostream& operator <<(std::ostream& out, RigidBody* body) {
			return out << *body;
		}
};
