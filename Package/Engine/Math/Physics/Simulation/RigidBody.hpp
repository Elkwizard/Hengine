#pragma once

#include <unordered_set>

#include "../Math/Transform.hpp"
#include "Shape.hpp"
#include "Matter.hpp"

class RigidBody;

API_IMPORT bool asymmetricTriggerRule(const RigidBody&, const RigidBody&);

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

class Constraint2;

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
		};
		
		class Prohibited {
			private:
				std::vector<Vector> prohibited;
		
			public:
				Prohibited() {
		
				}
		
				void clear() {
					prohibited.clear();
				}
		
				void add(const Vector& dir) {
					prohibited.push_back(dir);
				}
				
				bool has(const Vector& dir) const {
					for (const Vector& wrong : prohibited)
						if (dot(wrong, dir) > 0.8)
							return true;
					return false;
				}
		};
	
		double density = 1.0;
		std::vector<Collider> colliders;

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
			// ctx.stroke(gl::Color::RED).rect(bounds.min, bounds.max);
		}

	public:
		API_CONST Transform position;
		API_CONST Transform velocity;

		API int name;
		size_t wave;
		
		Matter localMatter, matter;
		AABB localBounds, bounds;
		
		Prohibited prohibited;
		API_CONST std::vector<Constraint2*> constraints;
		
		API bool dynamic;
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

		API void setDensity(double _density) {
			localMatter *= _density / density;
			syncMatter();
			density = _density;
		}

		API double getDensity() const {
			return density;
		}

		API double getMass() {
			syncMatter();
			return matter.mass;
		}

		API Inertia getInertia() {
			syncMatter();
			return matter.inertia;
		}

		API void addShape(Shape* shape) {
			localMatter += shape->getMatter() * density;
			colliders.emplace_back(shape);
		}

		API void removeShape(Shape* shape) {
			localMatter -= shape->getMatter() * density;
			erase(colliders, shape);
		}

		bool isTriggerWith(const RigidBody& other) const {
			return !trivialTriggerRule && (isTrigger || asymmetricTriggerRule(*this, other));
		}

		int getShapeCount() const {
			return colliders.size();
		}

		const Shape& getShape(int index) const {
			return colliders[index].cache(position);
		}
		
		Vector getPointVelocity(const Vector& r) const {
			if (!dynamic) return { };

			return IF_3D(
				cross(velocity.orientation.getRotation(), r),
				r.normal() * velocity.orientation.getRotation()
			) + velocity.linear;
		}

		template <Derivative D>
		void applyRelativeImpulse(const Vector& offset, const Vector& imp) {
			if (!dynamic) return;

			(this->*D).linear += matter.invMass * imp;

			if (canRotate) {
				Cross torque = cross(offset, imp);
				ONLY_2D(if (torque)) (this->*D).orientation += Orientation(matter.invInertia * torque);
			}
		}

		API void applyImpulse(const Vector& pos, const Vector& imp) {
			applyRelativeImpulse<&RigidBody::velocity>(pos - position.linear, imp);
		}

		void cache() {
			// update bounds
			localBounds = { };
			Transform orientationOnly = { {}, position.orientation };
			for (Collider& collider : colliders) {
				collider.updateBounds(dynamic, orientationOnly);
				localBounds.add(collider.bounds);
			}
		}

		void sync() {
			syncMatter();
			invalidateColliders();
		}

		void integrate(double dt) {
#if IS_3D
			Inertia oldInertia = matter.inertia;
#endif

			// motion
			position.linear += velocity.linear * dt;
			if (canRotate)
				position.orientation += velocity.orientation * dt;
			
			sync();
			
#if IS_3D
			// precession
			if (canRotate) {
				velocity.orientation = Orientation(
					matter.invInertia * oldInertia * velocity.orientation.getRotation()
				);
			}
#endif
		}

		RayHit raycast(const Ray& ray) const {
			RayHit best;

			for (int i = 0; i < getShapeCount(); i++) {
				double dist = getShape(i).raycast(ray);
				best.add({ (RigidBody*)this, dist });
			}

			return best;
		}
};