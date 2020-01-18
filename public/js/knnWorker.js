'use strict';

class KnnWorker {

    knn;
    postMessage;

    onmessage(message) {
        const { type, params } = message;
        switch (type) {
            case 'fit':
                {
                    const { X, y, k } = params;
                    this.knn = new KNN(k);
                    this.knn.fit(X, y);
                    break;
                }
            case 'getKNearestNeighbors':
                {
                    const X = params.X
                    const kNearestNeighborss = X.map((x, index) => {
                        this.postMessage({
                            type: 'progress',
                            value: { actualIndexZeroBased: index, endIndexZeroBasedExclusive: X.length }
                        });
                        return this.knn.getKNearestNeighbors(x);
                    });
                    this.postMessage({ type: 'result', value: kNearestNeighborss });
                    break;
                }
        }
    }
}