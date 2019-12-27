'use strict';

importScripts('idGenerator.js');
importScripts('decisionTree.js');

onmessage = e => postMessage({ type: 'result', value: get_split_for_chunk(e.data) });

function get_split_for_chunk({ chunk, nodeId, dataset }) {
    return new Splitter({
        onNodeAdded: node => {},
        onEdgeAdded: (fromNode, toNode) => {},
        onStartSplit: nodeId => {},
        onInnerSplit: ({ nodeId, actualSplitIndex, endSplitIndex, numberOfEntriesInDataset }) => {
            postMessage({
                type: 'inner-split',
                value: { nodeId, actualSplitIndex, endSplitIndex, numberOfEntriesInDataset }
            });
        },
        onEndSplit: nodeId => {}
    }).get_split_for_chunk(chunk, nodeId, dataset);
}