'use strict';

class Cache {

    constructor() {
        this.cache = {};
    }

    get(key, computeValue) {
        // FK-TODO: vergleich mit einem Array als key sollte eigentlich nicht funktionieren. Anders prüfen mit compareFlatArrays().
        if (!this.cache.hasOwnProperty(key)) {
            this.cache[key] = computeValue();
        }
        return this.cache[key];
    }
}