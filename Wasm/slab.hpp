#pragma once

#include <memory>
#include <vector>
#include <cassert>

#include "api.hpp"

API class _Slab {
	private:
		int elementBytes;
		std::unique_ptr<char[]> data;

		bool outOfBounds(int index) const {
			return index < 0 || index >= length;
		}

		template <typename T>
		T getValue(int index) const {
			return *(T*)get(index);
		}

		template <typename T>
		void setValue(int index, T value) {
			*(T*)get(index) = value;
		}
	
	public:
		API_CONST int length;
		
		API _Slab(int _elementBytes, int _length) {
			elementBytes = _elementBytes;
			length = _length;
			data = std::make_unique<char[]>(length * elementBytes);
		}

		template <typename T>
		_Slab(const std::vector<T>& arr) : _Slab(sizeof(T), arr.size()) {
			memcpy(data.get(), &arr[0], sizeof(T) * arr.size());
		}

		API void* getPointer(int index) const {
			return getValue<void*>(index);
		}

		API void setPointer(int index, void* value) {
			setValue<void*>(index, value);
		}

		API void* get(int index) const {
			if (outOfBounds(index)) return nullptr;
			return (void*)((size_t)data.get() + elementBytes * index);
		}

		template <typename T>
		operator std::vector<T>() const {
			assert(sizeof(T) == elementBytes);
			std::vector<T> arr(length);
			memcpy(&arr[0], data.get(), sizeof(T) * arr.size());
			return arr;
		}
};