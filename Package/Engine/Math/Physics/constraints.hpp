#pragma once

#include "global.hpp"
#include "rigidbody.hpp"
#include "matrix.hpp"

API class Constraint {
	protected:
		struct Error {
			Vector position, velocity;
		};

		Matrix forceToError;

		virtual Error getError() = 0;
		Vector a, b;
		
	public:
		API enum Type { LENGTH1, LENGTH2, POSITION1, POSITION2 };

		API_CONST Type type;
		API_CONST ID id;
		
		Constraint(Type type);
		virtual ~Constraint() { }

		API virtual bool hasBody(const RigidBody& body) const = 0;
		API virtual Vector& getA() = 0;
		API virtual Vector& getB() = 0;
		virtual void solve() = 0;
		virtual void add() = 0;
		virtual void remove() = 0;
};

API using Constraints = std::vector<Constraint*>;

API class Constraint1 : public Constraint {
	private:
		static constexpr double INTENSITY = 0.1;

	protected:
		static Error combineError(const Vector& positionError, const Vector& velocityError);

    public:
		API RigidBody& body;
		API Vector offset;
		API Vector point;

		Constraint1(Type _type, RigidBody& _body, const Vector& _offset, const Vector& _point);

		void add() override;
		Vector& getA() override;
		Vector& getB() override;
		bool hasBody(const RigidBody& b) const override;
		void solve() override;
		void remove() override;
};

API class Constraint2 : public Constraint {
	private:
		static constexpr double INTENSITY = 0.9;

	protected:
		static Error combineError(const Vector& positionError, const Vector& velocityError);

	public:
		API RigidBody& bodyA;
		API RigidBody& bodyB;
		API Vector offsetA, offsetB;
		API bool staticA, staticB;

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