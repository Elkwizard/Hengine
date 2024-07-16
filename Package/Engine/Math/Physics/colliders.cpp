#pragma once

#include "colliders.hpp"
#include "vector.hpp"

#define PI 3.14159265358979323846

// PolygonCollider
PolygonCollider::PolygonCollider(const std::vector<Vector>& _vertices) : Collider(POLYGON) {
	vertices = _vertices;
	position = { };
	for (const Vector& vec : vertices)
		position += vec;
	position /= vertices.size();

	axes.resize(vertices.size());

	for (int i = 0; i < vertices.size(); i++) {
		Vector a = vertices[i];
		Vector b = vertices[(i + 1) % vertices.size()];
		axes[i] = (b - a).normal().normalize();
	}

	{ // bounding radius
		double maxSqrRadius = 0.0;
		for (const Vector& vec : vertices) {
			double sqrRadius = vec.sqrMag();
			if (sqrRadius > maxSqrRadius)
				maxSqrRadius = sqrRadius;
		}

		boundingRadius = sqrt(maxSqrRadius);
	};

	// models
	model = std::unique_ptr<Model>(new PolygonModel(*this));
}

void PolygonCollider::computeMatterData() {
	{ // mass
		mass = 0.0;
		for (int i = 0; i < vertices.size(); i++) {
			Vector a = vertices[i] - position;
			Vector b = vertices[(i + 1) % vertices.size()] - position;
			mass += abs(a.cross(b)) / 2.0;
		}
	};
	
	// inertia
	auto rightInertia = [](double b, double h) {
		return (3.0 * h * pow(b, 3) + pow(h, 3) * b) / 12.0;
	};

	inertia = 0.0;

	for (int i = 0; i < vertices.size(); i++) {
		// construct triangle from 
		Vector A = vertices[i];
		Vector B = vertices[(i + 1) % vertices.size()];
		Vector C = position;

		// transform from global xy to local uv
		Vector uAxis = (C - B).normalize();
		auto u = [&](const Vector& p) { return (p - B).dot(uAxis); };
		auto v = [&](const Vector& p) { return (p - B).cross(uAxis); };
		auto toUV = [&](const Vector& p) { return Vector(u(p), v(p)); };

		Vector Auv = toUV(A);
		Vector Cuv = toUV(C);

		// find moment of inertia of left right triangle about B
		double G0 = rightInertia(Auv.x, Auv.y);

		// find moment of inertia of right right triangle about C
		double rightSideInertia = rightInertia(Cuv.x - Auv.x, Auv.y);

		// transform MoI about C into MoI about B
		double rightSideMass = (Cuv.x - Auv.x) * Auv.y / 2.0;
		Vector rightSideCenter { (Cuv.x + 2.0 * Auv.x) / 3.0, Auv.y / 3.0 };
		double G1 = rightSideInertia + rightSideMass * (rightSideCenter.sqrMag() - (Cuv - rightSideCenter).sqrMag());
		
		// find total moment of inertia about (u,v) = (0,0)
		double I_zuv = abs(G0 + G1);

		// transform inertia about B to inertia about the origin
		Vector M = (A + B + C) / 3.0;
		double m = abs(Cuv.x * Auv.y) / 2.0;

		double I_z = I_zuv + m * (M.sqrMag() - (M - B).sqrMag());

		// accumulate to running total
		inertia += I_z;
	}
}

PolygonModel::PolygonModel(const PolygonCollider& _collider) : Model(_collider) {
	const PolygonCollider& col = (const PolygonCollider&)collider;
	vertices.resize(col.vertices.size());
	axes.resize(col.axes.size());
}

void PolygonModel::update(const Vector& pos, double cos, double sin) {
	const PolygonCollider& col = (const PolygonCollider&)collider;
	
	for (int i = 0; i < vertices.size(); i++) {
		auto [x, y] = col.vertices[i];
		Vector& vertex = vertices[i];
		vertex.x = x * cos - y * sin + pos.x;
		vertex.y = x * sin + y * cos + pos.y;
	}

	for (int i = 0; i < axes.size(); i++) {
		auto [x, y] = col.axes[i];
		Vector& axis = axes[i];
		axis.x = x * cos - y * sin;
		axis.y = x * sin + y * cos;
	}

	auto [x, y] = col.position;
	position.x = x * cos - y * sin + pos.x;
	position.y = x * sin + y * cos + pos.y;
}

void PolygonModel::displace(const Vector& v) {
	position += v;
	for (Vector& vec : vertices)
		vec += v;
}

// CircleCollider
CircleCollider::CircleCollider(double x, double y, double _radius) : Collider(CIRCLE) {
	position = { x, y };
	radius = _radius;
	boundingRadius = position.mag() + radius;
	model = std::unique_ptr<Model>(new CircleModel(*this));
}

void CircleCollider::computeMatterData() {
	mass = pow(radius, 2) * PI;
	inertia = position.sqrMag() + 1.25 * pow(radius, 2) * mass;
}

CircleModel::CircleModel(const CircleCollider& _collider) : Model(_collider) {
	position = { };
	radius = 0.0;
}

void CircleModel::update(const Vector& pos, double cos, double sin) {
	const CircleCollider& col = (const CircleCollider&)collider;
	
	radius = col.radius;
	auto [x, y] = col.position;
	position.x = cos * x - sin * y + pos.x;
	position.y = sin * x + cos * y + pos.y;
}

void CircleModel::displace(const Vector& v) {
	position += v;
}