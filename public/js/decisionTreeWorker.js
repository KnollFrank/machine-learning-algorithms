'use strict';

importScripts('idGenerator.js');
importScripts('decisionTree.js');

onmessage = function(e) {
    const { dataset, max_depth, min_size } = e.data;
    const tree = new DecisionTreeBuilder(max_depth, min_size).build_tree(dataset);
    postMessage(tree);
}