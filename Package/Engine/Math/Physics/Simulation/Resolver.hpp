#pragma once

#include <vector>
#include <concepts>

#include "../Global.hpp"
#include "../Math/Random.hpp"
#include "Constraint/Constraint.hpp"
#include "Constraint/Constraint2.hpp"

template <std::derived_from<Constraint> T, void (T::* S)()>
class Resolver {
	private:
		std::vector<T*> staticConstraints, dynamicConstraints;

		std::vector<T*>& getConstraintList(T* con) {
			return con->dynamic ? dynamicConstraints : staticConstraints;
		}

		void solveConstraints(std::vector<T*>& constraints) {
			rng.shuffle(constraints);
			for (T* con : constraints)
				(con->*S)();
		}

	public:
		Resolver() {

		}

		void clear() {
			staticConstraints.clear();
			dynamicConstraints.clear();
		}

		void addConstraint(T* con) {
			con->cache();
			getConstraintList(con).push_back(con);
		}

		void solve(int count = 1) {
			for (int i = 0; i < count; i++) {
				solveConstraints(dynamicConstraints);
				solveConstraints(staticConstraints);
			}
		}
};