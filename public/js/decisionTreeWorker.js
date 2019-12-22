'use strict';

importScripts('idGenerator.js');
importScripts('decisionTree.js');

onmessage = function(e) {
    const { dataset, max_depth, min_size } = e.data;
    const tree = new DecisionTreeBuilder(
        max_depth,
        min_size, {
            onNodeAdded: function(node) {
                postMessage({
                    type: 'info',
                    value: 'node added ' + node.id
                });
            },
            onEdgeAdded: function(fromNode, toNode) {}
        }).build_tree(dataset);
    postMessage({
        type: 'result',
        value: tree
    });
}