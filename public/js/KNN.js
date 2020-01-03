'use strict';

// FK-TODO: verwende k-d trees
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
            distancesX2x.push({ index: i, distance: this.getSquaredEuclideanDistance(this.X[i], x) });
        }
        distancesX2x.sort((distance1, distance2) => distance1.distance - distance2.distance);
        return this.y[distancesX2x[0].index];
    }

    getSquaredEuclideanDistance(pointA, pointB) {
        return zip(pointA, pointB)
            .map(([coordA, coordB]) => (coordA - coordB) ** 2)
            .sum();
    }
}