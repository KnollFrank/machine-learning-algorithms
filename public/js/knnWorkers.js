'use strict';

const knnWorkers = [];

for (let i = 0; i < window.navigator.hardwareConcurrency; i++) {
    knnWorkers.push(new Worker('js/knnWorker.js'));
}