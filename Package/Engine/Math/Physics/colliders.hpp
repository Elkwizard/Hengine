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

API class Collider {
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

API class PolygonCollider : public Collider {
    public:
		std::vector<Vector> vertices;
		std::vector<Vector> axes;
		Vector position;

		API PolygonCollider(const std::vector<Vector>& _vertices);
		void computeMatterData() override;
};

class PolygonModel : public Model {
	public:
		std::vector<Vector> vertices;
		std::vector<Vector> axes;
		Vector position;

    	PolygonModel(const PolygonCollider& _collider);

		void update(const Vector& pos, double cos, double sin) override;
		void displace(const Vector& v) override;
};

API class CircleCollider : public Collider {
    public:
		Vector position;
		double radius;

		API CircleCollider(double x, double y, double _radius);
		void computeMatterData() override;
};

class CircleModel : public Model {
    public:
		Vector position;
		double radius;

		CircleModel(const CircleCollider& _collider);
		void update(const Vector& pos, double cos, double sin) override;
		void displace(const Vector& v) override;
};