'use strict';

importScripts('jsHelper.js');
importScripts('KDTree.js');
importScripts('KNN.js');

let knn;

onmessage = e => {
    console.log('Worker for KNN received message:', e.data);
    const { type, params } = e.data;
    switch (type) {
        case 'fit': {
            const { X, y, k } = params;
            knn = new KNN(k);
            knn.fit(X, y);
            break;
        }
        case 'predict': {
            const X = params.X
            const predictions = X.map(x => knn.predict(x));
            postMessage(predictions);
            break;
        }
    }
}