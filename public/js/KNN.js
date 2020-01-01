'use strict';

class KNN {
    constructor(k) {
        this.k = k;
    }

    fit(X, y) {
        this.X = X;
        this.y = y;
    }

    predict(x) {
        const distances2x = [];
        for (let i = 0; i < this.X.length; i++) {
            distances2x.push({ index: i, distance: Math.sqrt((this.X[i] - x) ** 2) });
        }
        distances2x.sort((a, b) => a.distance - b.distance);
        return this.y[distances2x[0].index];
    }
}