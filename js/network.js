'use strict';

function createNetwork(node, attributeNames, depth = 0) {
    if (typeof node === 'object') {
        return createNetworkNodesFromLeftAndRightNodeChild(node, attributeNames, depth);
    } else {
        return createNetworkNode(node, depth);
    }
}

function createNetworkNodesFromLeftAndRightNodeChild(node, attributeNames, depth) {
    let leftNetwork = createNetwork(node.left, attributeNames, depth + 1);
    let rightNetwork = createNetwork(node.right, attributeNames, depth + 1);

    let newNode = createNode(`${attributeNames[node.index]} < ${node.value}`, depth);

    const createOneLevelEdges = (fromNode, toNodes, label) =>
        toNodes
        .filter(toNode => toNode.level == fromNode.level + 1)
        .map(toNode => ({
            from: fromNode.id,
            to: toNode.id,
            label: label
        }));

    let newEdges =
        createOneLevelEdges(newNode, leftNetwork.nodes, "true")
        .concat(
            createOneLevelEdges(newNode, rightNetwork.nodes, "false"));

    return {
        nodes: [newNode].concat(leftNetwork.nodes, rightNetwork.nodes),
        edges: newEdges.concat(leftNetwork.edges, rightNetwork.edges)
    };
}

function createNetworkNode(label, depth) {
    return {
        nodes: [createNode(label, depth)],
        edges: []
    };
}

function createNode(label, depth) {
    let id = newId();
    return {
        id: id,
        label: label,
        level: depth,
        shape: 'box'
    };
}

let network = null;

function destroyNetwork() {
    if (network !== null) {
        network.destroy();
        network = null;
    }
}

function displayNetwork(container, data) {
    destroyNetwork();

    // create a network
    const options = {
        layout: {
            hierarchical: {
                direction: "UD"
            }
        }
    };
    network = new vis.Network(container, data, options);

    // add event listeners
    network.on('select', function(params) {
        document.getElementById('selection').innerHTML = 'Selection: ' + params.nodes;
    });
}