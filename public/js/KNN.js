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
        const k_nearest_y2x = distancesX2x.slice(0, this.k).map(({ index }) => this.y[index]);
        return getElementWithHighestOccurence(k_nearest_y2x);
    }

    getSquaredEuclideanDistance(pointA, pointB) {
        return zip(pointA, pointB)
            .map(([coordA, coordB]) => (coordA - coordB) ** 2)
            .sum();
    }
}