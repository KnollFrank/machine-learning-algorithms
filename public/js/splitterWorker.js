'use strict';

importScripts('idGenerator.js');
importScripts('decisionTree.js');

onmessage = function(e) {
    const [b_index, b_value, b_score, b_groups] = get_split_for_chunk(e.data);
    postMessage([b_index, b_value, b_score, b_groups]);
}

function get_split_for_chunk({ chunk, nodeId, dataset }) {
    return new Splitter(dummyTreeListener).get_split_for_chunk(chunk, nodeId, dataset);
}