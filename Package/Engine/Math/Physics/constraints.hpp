#pragma once

#include "exports.hpp"
#include "rigidbody.hpp"
#include "matrix.hpp"

class Constraint {
	protected:
		struct Error {
			Vector position, velocity;
		};

		Matrix forceToError;

		virtual Error getError() = 0;
		Vector a, b;
		
	public:
		enum Type { LENGTH1, LENGTH2, POSITION1, POSITION2 };

		Type type;
		ID id;
		
		Constraint(Type type);
		virtual ~Constraint() { }

		virtual bool hasBody(const RigidBody& body) const = 0;
		virtual Vector& getA() = 0;
		virtual Vector& getB() = 0;
		virtual void solve() = 0;
		virtual void add() = 0;
		virtual void remove() = 0;
};

using Constraints = std::vector<Constraint*>;

GETTER(Constraint, type, int) { return object->type; }
ACCESS(Constraint, id, int)
OBJECT_GETTER(Constraint, a, Vector) { return &object->getA(); }
OBJECT_GETTER(Constraint, b, Vector) { return &object->getB(); }
FN(Constraint, hasBody, bool)(Constraint* con, RigidBody* body) {
	return con->hasBody(*body);
}

class Constraint1 : public Constraint {
	private:
		static constexpr double INTENSITY = 0.1;

	protected:
		static Error combineError(const Vector& positionError, const Vector& velocityError);

    public:
		RigidBody& body;
		Vector offset;
		Vector point;

		Constraint1(Type _type, RigidBody& _body, const Vector& _offset, const Vector& _point);

		void add() override;
		Vector& getA() override;
		Vector& getB() override;
		bool hasBody(const RigidBody& b) const override;
		void solve() override;
		void remove() override;
};

OBJECT_GETTER(Constraint1, body, RigidBody) { return &object->body; }
OBJECT_ACCESS(Constraint1, offset, Vector)
OBJECT_ACCESS(Constraint1, point, Vector)

class Constraint2 : public Constraint {
	private:
		static constexpr double INTENSITY = 0.9;

	protected:
		static Error combineError(const Vector& positionError, const Vector& velocityError);

	public:
		RigidBody& bodyA;
		RigidBody& bodyB;
		Vector offsetA, offsetB;
		bool staticA, staticB;

		Constraint2(Type _type, RigidBody& a, RigidBody& b, const Vector& aOff, const Vector& bOff);

		bool getDynamicA() const;
		bool getDynamicB() const;
		Vector& getA() override;
		Vector& getB() override;
		void add() override;
		bool hasBody(const RigidBody& b) const override;
		void solve() override;
		void remove() override;
};


OBJECT_GETTER(Constraint2, bodyA, RigidBody) { return &object->bodyA; }
OBJECT_GETTER(Constraint2, bodyB, RigidBody) { return &object->bodyB; }
OBJECT_ACCESS(Constraint2, offsetA, Vector)
OBJECT_ACCESS(Constraint2, offsetB, Vector)
ACCESS(Constraint2, staticA, bool)
ACCESS(Constraint2, staticB, bool)

using NativeConstraintArray = NativeArray<Constraint*>;

CONSTRUCT(NativeConstraintArray)(int length) { return new NativeConstraintArray(length); }
FREE(NativeConstraintArray)
GETTER(NativeConstraintArray, length, int) { return object->getLength(); }
OBJECT_FN(NativeConstraintArray, get, Constraint)(NativeConstraintArray* arr, int index) { return arr->get(index); }
FN(NativeConstraintArray, set, void)(NativeConstraintArray* arr, int index, Constraint* body) { arr->set(index, body); }