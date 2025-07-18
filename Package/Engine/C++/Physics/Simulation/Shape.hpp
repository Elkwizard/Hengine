#pragma once

#include "../Math/Face.hpp"
#include "../Math/Transform.hpp"
#include "../../Math/AABB.hpp"
#include "../../Math/Shadow.hpp"
#include "Matter.hpp"

#include <unordered_map>

API class Shape {
	protected:
		virtual void output(std::ostream& out) const = 0;
	
	public:
		enum Type { BALL, POLYTOPE, COUNT };
		Type type;
		Shape* model;

		Shape(Type _type) {
			type = _type;
		}

		virtual ~Shape() { }
		virtual Shape* copy() const = 0;
		virtual void clearCache() { }
		virtual void sync(const Shape&, const Transform& transf) = 0;
		virtual Matter getMatter() const = 0;
		virtual AABB getBounds() const = 0;
		virtual AABB getBallBounds() const = 0;
		virtual double raycast(const Ray& ray) const = 0;

		friend std::ostream& operator <<(std::ostream& out, const Shape& shape) {
			shape.output(out);
			return out;
		}
};

API class Ball : public Shape {
	protected:
		void output(std::ostream& out) const override {
			out << "Ball(" << position << ", " << radius << ")";
		}

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
			double mass = IF_3D(
				4.0 / 3.0 * PI * std::pow(radius, 3),
				PI * std::pow(radius, 2)
			);
			Inertia inertia = IF_3D(0.4, 0.5) * mass * std::pow(radius, 2);
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

template <>
class std::hash<std::pair<int, int>> {
	private:
		std::hash<int> hash;

	public:
		size_t operator()(const std::pair<int, int>& pair) const {
			return hash(pair.first) ^ hash(pair.second * 31);
		}
};

API class Polytope : public Shape {
	private:
		using IndexFace = std::array<int, DIM>;
		using IndexEdge = std::array<int, 2>;
		
		std::vector<IndexFace> faces;
		std::vector<IndexEdge> edges;

		static Matter getComponentMatter(const Face& face) {
			Matrix fromAligned = IF_3D(
				Matrix(face.a, face.b, face.c),
				Matrix(face.start, face.end)
			);

			double determinant = fromAligned.determinant();
			double mass = determinant / factorial(DIM);
			
			auto product = [&](int xIndex, int yIndex) {
				Vector x = fromAligned.row(xIndex);
				Vector y = fromAligned.row(yIndex);
				return x.sum() * y.sum() + x.sqrMag();
			};

#if IS_3D
			Inertia rawInertia {
				product(1, 1) + product(2, 2), -product(0, 1), -product(0, 2),
				-product(0, 1), product(0, 0) + product(2, 2), -product(1, 2),
				-product(0, 2), -product(1, 2), product(0, 0) + product(1, 1)
			};
#else		

			Inertia rawInertia = product(0, 0) + product(1, 1);
#endif
			
			double coefficient = determinant / factorial(DIM + 2);
			return { mass, rawInertia * coefficient, false };
		}

		void computeDependentData() {
#if IS_3D
			// de-duplicate
			std::unordered_map<Vector, int> indexMapping;
			std::vector<Vector> uniqueVertices;
			for (const Vector& vertex : vertices) {
				if (!indexMapping.count(vertex)) {
					indexMapping.insert(std::make_pair(vertex, uniqueVertices.size()));
					uniqueVertices.push_back(vertex);
				}
			}

			std::vector<IndexFace> uniqueFaces;
			auto mapIndex = [&](int index) {
				return indexMapping[vertices[index]];
			};

			for (const IndexFace& face : faces) {
				uniqueFaces.push_back({
					mapIndex(face[0]),
					mapIndex(face[1]),
					mapIndex(face[2])
				});
			}

			vertices = uniqueVertices;
			faces = uniqueFaces;
#endif

			position = average(vertices);
			
			std::unordered_set<Plane> discoveredPlanes;
			for (int i = 0; i < faces.size(); i++) {
				Vector normal = getFace(i).normal();
				Plane plane { normal, dot(normal, vertices[faces[i][0]]) };
				if (!discoveredPlanes.count(plane)) {
					discoveredPlanes.insert(plane);
					planes.push_back(plane);
				}
			}

#if IS_3D
			std::unordered_map<std::pair<int, int>, Vector> discoveredEdges;
			auto addEdge = [&](int a, int b, const Vector& normal) {
				std::pair<int, int> key = a < b ? std::make_pair(a, b) : std::make_pair(b, a);
				if (!discoveredEdges.count(key)) {
					discoveredEdges.insert_or_assign(key, normal);
				} else if (discoveredEdges.at(key) == normal) {
					discoveredEdges.erase(key);
				}
			};

			for (int i = 0; i < faces.size(); i++) {
				Vector normal = getFace(i).normal();
				auto [a, b, c] = faces[i];
				addEdge(a, b, normal);
				addEdge(b, c, normal);
				addEdge(a, c, normal);
			}

			std::unordered_set<Vector> discoveredEdgeAxes;
			for (const auto& [edge, normal] : discoveredEdges) {
				Vector a = vertices[edge.first];
				Vector b = vertices[edge.second];
				Vector edgeAxis = (b - a).idemparallel();
				if (!discoveredEdgeAxes.count(edgeAxis)) {
					discoveredEdgeAxes.insert(edgeAxis);
					edgeAxes.push_back(edgeAxis);
				}
				edges.push_back({ edge.first, edge.second });
			}
#else
			edges = faces;
#endif
		}

	protected:
		void output(std::ostream& out) const override {
			out << "Polytope(" << vertices << ")";
		}

	public:
		std::vector<Vector> vertices;
		std::vector<Plane> planes;
		std::vector<Vector> edgeAxes;
		mutable std::unordered_map<const Polytope*, Vector> collisionCache;
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

		void clearCache() override {
			collisionCache.clear();
		}

		void sync(const Shape& reference, const Transform& transf) override {
			const Polytope& poly = (const Polytope&)reference;
			for (int i = 0; i < vertices.size(); i++)
				vertices[i] = transf * poly.vertices[i];
			for (int i = 0; i < edgeAxes.size(); i++)
				edgeAxes[i] = transf.orientation * poly.edgeAxes[i];
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
			return edges.size();
		}

		Line getEdge(int index) const {
			return {
				vertices[edges[index][0]],
				vertices[edges[index][1]]
			};
		}

		Matter getMatter() const override {
			Matter result;

			for (int i = 0; i < faces.size(); i++)
				result += getComponentMatter(getFace(i));
			
			result.computeInverses();
			return result;
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

		double getMaxExtent(const Vector& axis) const {
			double max = -INFINITY;
			for (const Vector& vert : vertices)
				max = std::max(max, dot(vert, axis));
			return max;
		}

		double getMinExtent(const Vector& axis) const {
			double min = INFINITY;
			for (const Vector& vert : vertices)
				min = std::min(min, dot(vert, axis));
			return min;
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