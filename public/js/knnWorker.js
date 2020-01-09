'use strict';

importScripts('jsHelper.js');
importScripts('KDTree.js');
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
                const kNearestNeighborss = X.map(x => knn.getKNearestNeighbors(x));
                postMessage(kNearestNeighborss);
                break;
            }
    }
}