'use strict';

importScripts('../jsHelper.js');
importScripts('KNN.js');
importScripts('knnWorker.js');
importScripts('knnWorkerSync.js');

const knnWorker = new KnnWorker();

onmessage = e => {
    knnWorker.postMessage = data => postMessage(data);
    knnWorker.onmessage(e.data);
}