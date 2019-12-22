'use strict';

importScripts('idGenerator.js');
importScripts('decisionTree.js');

onmessage = function(e) {
    postMessage({
        type: 'result',
        value: build_tree(e.data)
    });
}

function build_tree({ dataset, max_depth, min_size }) {
    return new DecisionTreeBuilder(
            max_depth,
            min_size,
            createTreeListener())
        .build_tree(dataset);
}

function createTreeListener() {
    const timedExecutor = new TimedExecutor(100);
    let rootNode;
    return {
        onNodeAdded: node => {
            if (!rootNode) {
                rootNode = node;
            }
            timedExecutor.execute(() => postMessage({ type: 'info', value: rootNode }));
        },
        onEdgeAdded: (fromNode, toNode) => {
            timedExecutor.execute(() => postMessage({ type: 'info', value: rootNode }));
        }
    }
}

class TimedExecutor {
    constructor(waitTimeMillis) {
        this.waitTimeMillis = waitTimeMillis;
        this.lastExecutionTime = new Date().getTime();
        this.firstExecution = true;
    }

    execute(callback) {
        const actualExecutionTime = new Date().getTime();
        if (actualExecutionTime - this.lastExecutionTime >= this.waitTimeMillis || this.firstExecution) {
            this.firstExecution = false;
            this.lastExecutionTime = actualExecutionTime;
            callback();
        }
    }
}