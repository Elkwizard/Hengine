class Cache {
    constructor(getValue, onInvalidate) {
        this.getValue = getValue;
        this.onInvalidate = onInvalidate;
        this.evaluated = false;
        this.__value = null;
    }
    invalidate() {
        this.evaluated = false;
        this.onInvalidate();
    }
    get() {
        if (!this.evaluated) {
            this.__value = this.getValue();
            this.evaluated = true;
        }
        return this.__value;
    }
}
class CacheManager {
    constructor() {
        this.caches = new Map();
    }
    createCache(name, getValue, onInvalidate = () => null) {
        let cache = new Cache(getValue, onInvalidate);
        this.caches.set(name, cache);
    }
    extract(manager) {
        for (let [key, value] of manager) {
            this.createCache(key, value.getValue, value.onInvalidate);
        }
    }
    invalidateCache(name) {
        this.caches.get(name).invalidate();
    }
    getCache(name) {
        return this.caches.get(name).get();
    }
}