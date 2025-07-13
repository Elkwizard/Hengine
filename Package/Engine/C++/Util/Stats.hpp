#pragma once

#include <unordered_map>
#include <string>

class Stats {
	private:
		std::unordered_map<std::string, int> counts;
		std::unordered_map<std::string, double> totals;

	public:
		void reset() {
			counts.clear();
			totals.clear();
		}

		void count(const std::string& key, int amount = 1) {
			counts[key] += amount;
		}

		void average(const std::string& key, double value) {
			count(key);
			totals[key] += value;
		}

		void js() {
			std::string result = "window.stats = {";
			for (const auto& [key, count] : counts) {
				result += "\"" + key + "\": ";
				if (totals.count(key)) {
					double average = totals.at(key) / count;
					result += std::to_string(average);
				} else {
					result += std::to_string(count);
				}
				result += ",";
			}
			result += "}";

			::js(result.c_str());
		}
} stats;