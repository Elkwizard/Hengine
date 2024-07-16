#pragma once

#include <vector>
#include <memory>

#include "vector.hpp"

class Collider;

class Model {
	protected:
		const Collider& collider;

	public:
		Model(const Collider& _collider) : collider(_collider) { }

		virtual ~Model() { }
		virtual void update(const Vector& pos, double cos, double sin) = 0;
		virtual void displace(const Vector& displacement) = 0;
};

class Collider {
	public:
		enum Type { POLYGON, CIRCLE };

		Type type;
		bool cacheValid;
		std::unique_ptr<Model> model;
		
		double mass, inertia;
		double boundingRadius;

		Collider(Type _type) {
			type = _type;
			cacheValid = false;
		}

		virtual ~Collider() { }
		virtual void computeMatterData() = 0;

		void invalidateCache() {
			cacheValid = false;
		}

		Model* cacheModel(const Vector& pos, double cos, double sin) {
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

class PolygonCollider : public Collider {
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

class PolygonModel : public Model {
	public:
		std::vector<Vector> vertices;
		std::vector<Vector> axes;
		Vector position;

    	PolygonModel(const PolygonCollider& _collider);

		void update(const Vector& pos, double cos, double sin) override;
		void displace(const Vector& v) override;
};

class CircleCollider : public Collider {
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

class CircleModel : public Model {
    public:
		Vector position;
		double radius;

		CircleModel(const CircleCollider& _collider);
		void update(const Vector& pos, double cos, double sin) override;
		void displace(const Vector& v) override;
};