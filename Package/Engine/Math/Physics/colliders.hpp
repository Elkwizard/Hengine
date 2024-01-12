#pragma once

#include <vector>
#include <memory>

#include "vector.hpp"

class BaseCollider;

class BaseModel {
	protected:
		const BaseCollider& collider;

	public:
		BaseModel(const BaseCollider& _collider) : collider(_collider) { }

		virtual ~BaseModel() { }
		virtual void update(const Vector& pos, double cos, double sin) = 0;
		virtual void displace(const Vector& displacement) = 0;
};

class BaseCollider {
	public:
		enum Type { POLYGON, CIRCLE };

		Type type;
		bool cacheValid;
		std::unique_ptr<BaseModel> model;
		
		double mass, inertia;
		double boundingRadius;

		BaseCollider(Type _type) {
			type = _type;
			cacheValid = false;
		}

		virtual ~BaseCollider() { }
		virtual void computeMatterData() = 0;

		void invalidateCache() {
			cacheValid = false;
		}

		BaseModel* cacheModel(const Vector& pos, double cos, double sin) {
			if (cacheValid) return model.get();
			else {
				cacheValid = true;
				model->update(pos, cos, sin);
				return model.get();
			}
		}

		void displaceCache(const Vector& v) {
			model->displace(v);
		}
};

class PolygonCollider : public BaseCollider {
    public:
		std::vector<Vector> vertices;
		std::vector<Vector> axes;
		Vector position;

		PolygonCollider(const std::vector<Vector>& _vertices);
		void computeMatterData() override;
};

CONSTRUCT(PolygonCollider)(NativeVectorArray* vertices) {
	return new PolygonCollider(vertices->data);
}
FREE(PolygonCollider)

class PolygonModel : public BaseModel {
	public:
		std::vector<Vector> vertices;
		std::vector<Vector> axes;
		Vector position;

    	PolygonModel(const PolygonCollider& _collider);

		void update(const Vector& pos, double cos, double sin) override;
		void displace(const Vector& v) override;
};

class CircleCollider : public BaseCollider {
    public:
		Vector position;
		double radius;

		CircleCollider(double x, double y, double _radius);
		void computeMatterData() override;
};

CONSTRUCT(CircleCollider)(double x, double y, double radius) {
	return new CircleCollider(x, y, radius);
}
FREE(CircleCollider)

class CircleModel : public BaseModel {
    public:
		Vector position;
		double radius;

		CircleModel(const CircleCollider& _collider);
		void update(const Vector& pos, double cos, double sin) override;
		void displace(const Vector& v) override;
};