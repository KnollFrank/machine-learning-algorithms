'use strict';

const splitterWorkers = [];

for (let i = 0; i < window.navigator.hardwareConcurrency; i++) {
    splitterWorkers.push(new Worker('js/decisionTree/splitterWorker.js'));
}