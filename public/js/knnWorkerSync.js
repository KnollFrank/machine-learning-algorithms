'use strict';

class KnnWorkerSync {

    knn;
    onmessage;

    postMessage(message) {
        this._onmessage({ data: message });
    }

    _onmessage(e) {
        const { type, params } = e.data;
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
                        this._postMessage({
                            type: 'progress',
                            value: { actualIndexZeroBased: index, endIndexZeroBasedExclusive: X.length }
                        });
                        return this.knn.getKNearestNeighbors(x);
                    });
                    this._postMessage({ type: 'result', value: kNearestNeighborss });
                    break;
                }
        }
    }

    _postMessage(message) {
        this.onmessage({ data: message });
    }
}