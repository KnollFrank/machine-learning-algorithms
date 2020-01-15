'use strict';

importScripts('jsHelper.js');
importScripts('KNN.js');

let knn;

onmessage = e => {
    const { type, params } = e.data;
    switch (type) {
        case 'fit':
            {
                const { X, y, k } = params;
                knn = new KNN(k);
                knn.fit(X, y);
                break;
            }
        case 'getKNearestNeighbors':
            {
                const X = params.X
                const kNearestNeighborss = X.map((x, index) => {
                    postMessage({
                        type: 'progress',
                        value: { actualIndexZeroBased: index, endIndexZeroBasedExclusive: X.length }
                    });
                    return knn.getKNearestNeighbors(x);
                });
                postMessage({ type: 'result', value: kNearestNeighborss });
                break;
            }
    }
}