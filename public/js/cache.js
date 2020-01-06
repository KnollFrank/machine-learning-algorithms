'use strict';

class Cache {

    constructor() {
        this.cache = {};
    }

    get(key, computeValue) {
        if (!this.cache.hasOwnProperty(key)) {
            this.cache[key] = computeValue();
        }
        return this.cache[key];
    }
}