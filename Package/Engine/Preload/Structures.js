class StackAllocator {
	constructor(Type) {
		this.Type = Type;
		this.pointer = 0;
		this.stack = [];
		this.objects = [];
	}
	push() {
		this.stack.push(this.pointer);
	}
	pop() {
		this.pointer = this.stack.pop();
	}
	next() {
		this.pop();
		this.push();
	}
	alloc() {
		return this.objects[this.pointer++] ??= new this.Type();
	}
}

class GrowableTypedArray {
	constructor(TypedArray) {
		this.TypedArray = TypedArray;
		this.array = new TypedArray(0);
	}
	getView(length) {
		if (length > this.array.length)
			this.array = new this.TypedArray(length * 2);
		return new this.TypedArray(this.array.buffer, 0, length);
	}
}

class SizeCappedCache {
	constructor(maxSize) {
		this.maxSize = maxSize;
		this.cache = new Map();
	}
	clear() {
		this.cache.clear();
	}
	get(key, create) {
		if (!this.cache.has(key)) {
			if (this.cache.size >= this.maxSize)
				this.cache.delete(this.cache.keys().next().value);
			
			this.cache.set(key, create());
		}

		return this.cache.get(key);
	}
}

class WeakCache {
	constructor() {
		this.cache = new Map();
	}
	clear() {
		this.cache.clear();
	}
	get(key, create) {
		if (!this.cache.has(key))
			this.cache.set(key, create());
		
		return this.cache.get(key);
	}
}