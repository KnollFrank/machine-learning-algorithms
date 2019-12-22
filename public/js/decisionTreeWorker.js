'use strict';

importScripts('idGenerator.js');
importScripts('decisionTree.js');

onmessage = function(e) {
    const { dataset, max_depth, min_size } = e.data;
    let rootNode;
    let lastPostMessageTime = new Date().getTime();
    const waitTime = 100;
    const tree = new DecisionTreeBuilder(
        max_depth,
        min_size, {
            onNodeAdded: node => {
                if (!rootNode) {
                    rootNode = node;
                }
                const actualPostMessageTime = new Date().getTime();
                if (actualPostMessageTime - lastPostMessageTime >= waitTime) {
                    lastPostMessageTime = actualPostMessageTime;
                    postMessage({
                        type: 'info',
                        value: rootNode
                    });
                }
            },
            onEdgeAdded: (fromNode, toNode) => {
                const actualPostMessageTime = new Date().getTime();
                if (actualPostMessageTime - lastPostMessageTime >= waitTime) {
                    lastPostMessageTime = actualPostMessageTime;
                    postMessage({
                        type: 'info',
                        value: rootNode
                    });
                }
            }
        }).build_tree(dataset);
    postMessage({
        type: 'result',
        value: tree
    });
}