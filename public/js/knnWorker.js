'use strict';

importScripts('jsHelper.js');
importScripts('KNN.js');
importScripts('knnWorkerSync.js');

const knnWorkerSync = new KnnWorkerSync();

onmessage = e => {
    knnWorkerSync.onmessage = e => postMessage(e.data);
    knnWorkerSync.postMessage(e.data);
}