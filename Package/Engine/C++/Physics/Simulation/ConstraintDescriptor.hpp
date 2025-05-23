#pragma once

#include "RigidBody.hpp"
#include "Constraint/Constraint.hpp"
#include "Constraint/LengthConstraint.hpp"

API class ConstraintDescriptor {
	public:
		API_CONST Constrained a, b;

		ConstraintDescriptor(const Constrained& _a, const Constrained& _b)
		: a(_a), b(_b) { }
		virtual ~ConstraintDescriptor() { }

		API bool hasBody(RigidBody& body) const {
			return &a.body == &body || &b.body == &body;
		}

		void add() {
			a.body.constraintDescriptors.push_back(this);
			b.body.constraintDescriptors.push_back(this);
		}

		void remove() {
			erase(a.body.constraintDescriptors, this);
			erase(b.body.constraintDescriptors, this);
		}

		virtual Constraint2* makeConstraint(bool prohibited, Constrained& a, Constrained& b) = 0;

		friend std::ostream& operator <<(std::ostream& out, const ConstraintDescriptor& desc) {
			out << "Constraint(" << desc.a.getAnchor() << ", " << desc.b.getAnchor() << ")";
			return out;
		}
};

API class LengthConstraintDescriptor : public ConstraintDescriptor {
	public:
		API double length;

		API LengthConstraintDescriptor(const Constrained& _a, const Constrained& _b, double _length)
		: ConstraintDescriptor(_a, _b) {
			length = _length;
		}

		Constraint2* makeConstraint(bool dynamic, Constrained& a, Constrained& b) override {
			return new LengthConstraint(dynamic, a, b, length);
		}
};

API class PositionConstraintDescriptor : public ConstraintDescriptor {
	public:
		API PositionConstraintDescriptor(const Constrained& _a, const Constrained& _b)
		: ConstraintDescriptor(_a, _b) { }

		Constraint2* makeConstraint(bool dynamic, Constrained& a, Constrained& b) override {
			return new LengthConstraint(dynamic, a, b, 0);
		}
};