'use strict';

// adapted from https://machinelearningmastery.com/implement-decision-tree-algorithm-scratch-python/

function getMinOfArray(es, getMinElement) {
    return es.reduce(getMinElement);
}

function splitItemsIntoChunks({
    numItems,
    maxNumChunks
}) {
    if (numItems == 0) {
        return [];
    }
    const chunks = [];
    const chunkSize = numItems < maxNumChunks ? 1 : Math.floor(numItems / maxNumChunks);
    for (let chunkIndex = 0; chunkIndex < Math.min(maxNumChunks, numItems) - 1; chunkIndex++) {
        chunks.push({
            oneBasedStartIndexOfChunk: chunkIndex * chunkSize + 1,
            oneBasedEndIndexInclusiveOfChunk: (chunkIndex + 1) * chunkSize
        });
    }
    chunks.push({
        oneBasedStartIndexOfChunk: (Math.min(maxNumChunks, numItems) - 1) * chunkSize + 1,
        oneBasedEndIndexInclusiveOfChunk: numItems
    });
    return chunks;
}

const dummyTreeListener = {
    onNodeAdded: node => {},
    onEdgeAdded: (fromNode, toNode) => {},
    onStartSplit: nodeId => {},
    onInnerSplit: ({
        nodeId,
        actualSplitIndex,
        endSplitIndex
    }) => {},
    onEndSplit: nodeId => {}
};

class DecisionTreeBuilder {

    constructor(max_depth, min_size, splitterWorkers, treeListener = dummyTreeListener) {
        this.max_depth = max_depth;
        this.min_size = min_size;
        this.splitterWorkers = splitterWorkers;
        this.treeListener = treeListener;
    }

    // Build a decision tree
    build_tree(train, k) {
        this.get_split(
            train,
            root => this.split(root, 1, root => k(prune(root))));
    }

    // Select the best split point for a dataset
    get_split(dataset, k) {
        const nodeId = newIdOld();
        const chunks = splitItemsIntoChunks({
            numItems: getNumberOfAttributes(dataset),
            maxNumChunks: this.splitterWorkers.length
        });
        this.get_splits_for_chunks(
            chunks,
            nodeId,
            dataset,
            splits_for_chunks => {
                const bestSplit =
                    getMinOfArray(
                        splits_for_chunks,
                        (split1, split2) => split1.score < split2.score ? split1 : split2);
                k(this._emitOnNodeAdded({
                    id: nodeId,
                    index: bestSplit.index,
                    value: bestSplit.value,
                    score: bestSplit.score,
                    groups: bestSplit.groups,
                    samples: dataset.length,
                }));
            });
    }

    get_splits_for_chunks(chunks, nodeId, dataset, k) {
        this.treeListener.onStartSplit(nodeId);
        const splits_for_chunks = [];
        for (let i = 0; i < chunks.length; i++) {
            this.get_split_for_chunk(
                i,
                chunks[i],
                nodeId,
                dataset,
                chunk => {
                    splits_for_chunks.push(chunk);
                    if (splits_for_chunks.length == chunks.length) {
                        this.treeListener.onEndSplit(nodeId);
                        k(splits_for_chunks);
                    }
                });
        }
    }

    get_split_for_chunk(workerIndex, chunk, nodeId, dataset, addChunk) {
        const worker = this.splitterWorkers[workerIndex];
        worker.onmessage = event => {
            const {
                type,
                value
            } = event.data;
            switch (type) {
                case 'inner-split':
                    const {
                        nodeId,
                        startSplitIndex,
                        actualSplitIndex,
                        endSplitIndex,
                        numberOfEntriesInDataset
                    } = value;
                    this.treeListener.onInnerSplit({
                        workerIndex,
                        nodeId,
                        startSplitIndex,
                        actualSplitIndex,
                        endSplitIndex,
                        numberOfEntriesInDataset
                    });
                    break;
                case 'result':
                    addChunk(value);
                    break;
            }
        };
        worker.postMessage({
            chunk,
            nodeId,
            dataset
        });
    }

    // Create child splits for a node or make terminal
    split(node, depth, k) {
        let [left, right] = node.groups;
        delete node.groups;
        // check for a no split
        if (left.length == 0 || right.length == 0) {
            node.left = this.to_terminal(left.concat(right));
            this._emitOnEdgeAdded(node, node.left);
            node.right = this.to_terminal(left.concat(right));
            this._emitOnEdgeAdded(node, node.right);
            k(node);
        }
        // check for max depth
        else if (depth >= this.max_depth) {
            node.left = this.to_terminal(left);
            this._emitOnEdgeAdded(node, node.left);
            node.right = this.to_terminal(right);
            this._emitOnEdgeAdded(node, node.right);
            k(node);
        } else {
            const processChild = (child, childName, k) => {
                if (child.length <= this.min_size) {
                    node[childName] = this.to_terminal(child);
                    this._emitOnEdgeAdded(node, node[childName]);
                    k(node);
                } else {
                    this.get_split(child, res => {
                        node[childName] = res;
                        this._emitOnEdgeAdded(node, node[childName]);
                        this.split(node[childName], depth + 1, _ => k(node));
                    });
                }
            }

            processChild(
                left,
                'left',
                _ => processChild(
                    right,
                    'right',
                    k));
        }
    }

    _emitOnNodeAdded(node) {
        this.treeListener.onNodeAdded(node);
        return node;
    }

    _emitOnEdgeAdded(fromNode, toNode) {
        this.treeListener.onEdgeAdded(fromNode, toNode);
    }

    // Create a terminal node value
    to_terminal(group) {
        const outcomes = group.map(getClassValFromRow);
        return this._emitOnNodeAdded({
            id: newIdOld(),
            value: getElementWithHighestOccurence(outcomes),
            samples: group.length,
            score: 0
        });
    }
}

function isInnerNode(node) {
    return 'left' in node || 'right' in node;
}

function isTerminalNode(node) {
    return !isInnerNode(node);
}

// Calculate accuracy percentage
function accuracy_percentage(actual, predicted) {
    let correct = 0;
    for (let i = 0; i < actual.length; i++) {
        if (actual[i] == predicted[i]) {
            correct++;
        }
    }
    return actual.length != 0 ? correct / actual.length * 100.0 : 0;
}

// Make a prediction with a decision tree
function predict(node, row) {
    if (!node) {
        return {
            value: null,
            nodes: []
        };
    }

    if (isTerminalNode(node)) {
        return {
            value: node.value,
            nodes: [node]
        };
    }

    const splitCondition =
        isNumber(node.value) ?
        Number(row[node.index]) < Number(node.value) :
        row[node.index] == node.value;

    let {
        value,
        nodes
    } = predict(splitCondition ? node.left : node.right, row);
    return {
        value: value,
        nodes: [node].concat(nodes)
    };
}

const actualClassVals = fold => fold.map(getClassValFromRow);

function prune(node) {
    let pruneDescr = {
        node: node,
        hasChange: false
    };
    do {
        pruneDescr = _prune(pruneDescr.node);
    } while (pruneDescr.hasChange);

    return pruneDescr.node;
}

function _prune(node) {
    let hasChange = false;

    function prune(node) {
        if (isTerminalNode(node)) {
            return node;
        }

        if (isTerminalNode(node.left) && isTerminalNode(node.right) && node.left.value == node.right.value) {
            hasChange = true;
            return node.left;
        }

        node.left = prune(node.left);
        node.right = prune(node.right);
        return node;
    }

    return {
        node: prune(node),
        hasChange: hasChange
    };
}