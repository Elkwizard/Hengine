#pragma once

#include <vector>
#include <concepts>

#include "../Global.hpp"
#include "../Math/Random.hpp"
#include "Constraint/Constraint.hpp"

template <std::derived_from<Constraint> T>
class Resolver {
	private:
		std::vector<std::unique_ptr<T>> staticConstraints, dynamicConstraints;

		std::vector<std::unique_ptr<T>>& getConstraintList(T* con) {
			return con->dynamic ? dynamicConstraints : staticConstraints;
		}

		template <void (T::* S)(double)>
		void solveConstraints(std::vector<std::unique_ptr<T>>& constraints, double dt) {
			rng.shuffle(constraints);
			for (const auto& con : constraints)
				(con.get()->*S)(dt);
		}

	public:
		Resolver() {

		}

		void clear() {
			staticConstraints.clear();
			dynamicConstraints.clear();
		}

		void addConstraint(T* con) {
			if (con == nullptr) return;
			getConstraintList(con).emplace_back(con);
		}

		template <void (T::* S)(double)>
		void solve(double dt, int count = 1) {
			for (int i = 0; i < count; i++) {
				solveConstraints<S>(dynamicConstraints, dt);
				solveConstraints<S>(staticConstraints, dt);
			}
		}
};