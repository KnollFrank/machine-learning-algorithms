'use strict';

importScripts('idGenerator.js');
importScripts('decisionTree.js');

onmessage = function(e) {
    const { dataset, max_depth, min_size } = e.data;
    let first = true;
    let rootNode;
    const tree = new DecisionTreeBuilder(
        max_depth,
        min_size, {
            onNodeAdded: node => {
                if (first) {
                    rootNode = node;
                    first = false;
                    postMessage({
                        type: 'info',
                        value: rootNode
                    });
                }
            },
            onEdgeAdded: function(fromNode, toNode) {
                postMessage({
                    type: 'info',
                    value: rootNode
                });
            }
        }).build_tree(dataset);
    postMessage({
        type: 'result',
        value: tree
    });
}