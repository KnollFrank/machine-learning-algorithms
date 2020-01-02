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
        const distancesX2x = [];
        for (let i = 0; i < this.X.length; i++) {
            distancesX2x.push({ index: i, distance: this.getDistance(this.X[i], x) });
        }
        distancesX2x.sort((distance1, distance2) => distance1.distance - distance2.distance);
        return this.y[distancesX2x[0].index];
    }

    getDistance(pointA, pointB) {
        return Math.sqrt(
            zip(pointA, pointB)
                .map(([coordA, coordB]) => (coordA - coordB) ** 2)
                .sum());
    }
}