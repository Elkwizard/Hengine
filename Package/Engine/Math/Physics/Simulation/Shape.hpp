#pragma once

#include "../Math/Face.hpp"
#include "../Math/Transform.hpp"
#include "../Math/AABB.hpp"
#include "../Math/Shadow.hpp"
#include "Matter.hpp"

#include <unordered_map>

API class Shape {
	public:
		enum Type { BALL, POLYTOPE, COUNT };
		Type type;
		Shape* model;

		Shape(Type _type) {
			type = _type;
		}

		virtual ~Shape() { }
		virtual Shape* copy() const = 0;
		virtual void sync(const Shape&, const Transform& transf) = 0;
		virtual Matter getMatter() const = 0;
		virtual AABB getBounds() const = 0;
		virtual AABB getBallBounds() const = 0;
		virtual double raycast(const Ray& ray) const = 0;
};

API class Ball : public Shape {
	public:
		Vector position;
		double radius;

		API Ball(const Vector& _position, double _radius)
		: Shape(BALL) {
			position = _position;
			radius = _radius;
		}

		Shape* copy() const override {
			return new Ball(*this);
		}

		void sync(const Shape& reference, const Transform& transf) override {
			const Ball& ball = (const Ball&)reference;
			position = transf * ball.position;
		}

		Matter getMatter() const override {
#if IS_3D
			double mass = 4.0 / 3.0 * PI * std::pow(radius, 3);
			Inertia inertia = 0.4 * mass * std::pow(radius, 2);
#else
			double mass = PI * std::pow(radius, 2);
			Inertia inertia = 1.25 * mass * std::pow(radius, 2);
#endif
			Matter result { mass, inertia };
			return result.translate(position);
		}

		AABB getBounds() const override {
			return AABB(radius) + position;
		}

		AABB getBallBounds() const override {
			return radius + position.mag();
		}

		Shadow getShadow(const Vector& axis) const {
			double center = dot(position, axis);
			return { center - radius, center + radius };
		}

		double raycast(const Ray& ray) const override {
			Vector toCenter = position - ray.origin;
			double toCenterT = dot(toCenter, ray.direction);
			if (toCenterT < 0) return -1;

			Vector offset = -toCenter.without(ray.direction);
			double dist = offset.mag();
			if (dist >= radius) return -1;
			
			double height = std::sqrt(radius * radius - dist * dist);
			return toCenterT - height;
		}
};

API class Polytope : public Shape {
	private:
		using IndexFace = std::array<int, DIM>;
		using IndexEdge = std::array<int, 2>;
		
		std::vector<IndexFace> faces;
		std::vector<IndexEdge> edges;

#if IS_3D
		static Matter getComponentMatter(Face tri) {
			Matrix fromAligned { tri.a, tri.b, tri.c };
			
			double mass = fromAligned.determinant() / factorial(DIM);
			
			auto product = [&](int xIndex, int yIndex) {
				Vector x = fromAligned.row(xIndex);
				Vector y = fromAligned.row(yIndex);
				return x.sum() * y.sum() + dot(x, y);
			};

			Matrix inertia = Matrix(
				product(1, 1) + product(2, 2), -product(0, 1), -product(0, 2),
				-product(0, 1), product(0, 0) + product(2, 2), -product(1, 2),
				-product(0, 2), -product(1, 2), product(0, 0) + product(1, 1)
			) * (mass / factorial(DIM + 2));

			return { mass, inertia, false };
		}
#else
		static Matter getComponentMatter(Face line) {
			Matrix fromAligned { line.start, line.end };
			double mass = fromAligned.determinant() / factorial(DIM);

			auto product = [&](int inx) {
				Vector x = fromAligned.row(inx);
				return pow(x.sum(), 2) + x.sqrMag();
			};

			double inertia = (product(0) + product(1)) * (mass / factorial(DIM + 2));

			return { mass, inertia, false };
		}
#endif

		void computeDependentData() {
			position = average(vertices);
			
			for (int i = 0; i < faces.size(); i++) {
				Vector normal = getFace(i).normal();
				planes.emplace_back(normal, dot(normal, vertices[faces[i][0]]));
			}

#if IS_3D
			std::unordered_map<int, std::unordered_set<int>> discovered;
			auto addEdge = [&](int a, int b) {
				if (b < a) std::swap(a, b);
				if (!discovered.count(a))
					discovered.emplace(a, std::unordered_set<int>());
				std::unordered_set<int>& set = discovered.at(b);
				if (!set.count(b)) {
					set.insert(b);
					edges.push_back({ a, b });
				}
			};

			for (auto [a, b, c] : faces) {
				addEdge(a, b);
				addEdge(b, c);
				addEdge(a, c);
			}
#else
			edges = faces;
#endif
		}

	public:
		std::vector<Vector> vertices;
		std::vector<Plane> planes;
		Vector position;

#if IS_3D
		Polytope(const std::vector<Vector>& _vertices, const std::vector<IndexFace>& _faces) : Shape(POLYTOPE) {
			vertices = _vertices;
			faces = _faces;
			computeDependentData();
		}

		API Polytope(const std::vector<Vector>& _vertices, const std::vector<int>& _faces) : Shape(POLYTOPE) {
			vertices = _vertices;
			faces = { };
			for (int i = 0; i < _faces.size(); i += 3)
				faces.push_back({ _faces[i], _faces[i + 1], _faces[i + 2] });
			computeDependentData();
		}
#else
		API Polytope(const std::vector<Vector>& _vertices) : Shape(POLYTOPE) {
			vertices = _vertices;
			for (int i = 0; i < vertices.size(); i++)
				faces.push_back({ i, (int)((i + 1) % vertices.size()) });
			computeDependentData();
		}
#endif

		Shape* copy() const override {
			return new Polytope(*this);
		}

		void sync(const Shape& reference, const Transform& transf) override {
			const Polytope& poly = (const Polytope&)reference;
			for (int i = 0; i < vertices.size(); i++)
				vertices[i] = transf * poly.vertices[i];
			for (int i = 0; i < planes.size(); i++) {
				const Plane& plane = poly.planes[i];
				planes[i].normal = transf.orientation * plane.normal;
				planes[i].distance = dot(transf.linear, planes[i].normal) + plane.distance;
			}
			position = transf * poly.position;
		}

		int getFaceCount() const {
			return faces.size();
		}

		Face getFace(int index) const {
			std::array<Vector, DIM> points;
			for (int i = 0; i < points.size(); i++)
				points[i] = vertices[faces[index][i]];
			return points;
		}

		int getEdgeCount() const {
			return faces.size() ONLY_3D( * 3);
		}

		Line getEdge(int index) const {
			return {
				vertices[edges[index][0]],
				vertices[edges[index][1]]
			};
		}

		Matter getMatter() const override {
			Matter sum { 0.0, 0.0, false };

			for (int i = 0; i < faces.size(); i++)
				sum += getComponentMatter(getFace(i));
			
			sum.computeInverses();
			return sum;
		}

		AABB getBounds() const override {
			AABB result { vertices[0] };

			for (int i = 1; i < vertices.size(); i++)
				result.add(vertices[i]);

			return result;
		}

		AABB getBallBounds() const override {
			double max = -INFINITY;

			for (const Vector& vert : vertices)
				max = std::max(max, vert.mag());
			
			return max;
		}

		Shadow getShadow(const Vector& axis) const {
			Shadow result { dot(vertices[0], axis) };
			for (int i = 1; i < vertices.size(); i++)
				result.add(dot(vertices[i], axis));
			return result;
		}

		double raycast(const Ray& ray) const override {
			double distance = -1;

			for (int i = 0; i < getFaceCount(); i++) {
				double dist = raycastFace(getFace(i), ray);
				if (dist > 0) {
					if (distance < 0 || dist < distance)
						distance = dist;
				}
			}

			return distance;
		}
};