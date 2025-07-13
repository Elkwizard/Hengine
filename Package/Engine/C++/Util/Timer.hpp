#pragma once

#include <chrono>

#include "Stats.hpp"

class Timer {
	private:
		double start;
		std::string_view name;
		bool done;

	public:
		Timer(const std::string_view& _name) {
			name = _name;
			start = now();
			done = false;
		}

		~Timer() {
			if (!done) end();
		}
		
		void end() {
			double duration = now() - start;
			stats.average("timer_" + (std::string)name, duration);
			done = true;
		}

		static double now() {
			using namespace std::chrono;
			return duration_cast<milliseconds>(
				high_resolution_clock::now().time_since_epoch()
			).count();
		}
};