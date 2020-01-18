'use strict';

const knnWorkers = [];

for (let i = 0; i < window.navigator.hardwareConcurrency; i++) {
    knnWorkers.push(createKnnWorker({ async: true }));
}

function createKnnWorker({ async }) {
    return async ? new Worker('js/knnWorkerAsync.js') : new KnnWorkerSync();
}