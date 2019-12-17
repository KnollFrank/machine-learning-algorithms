'use strict';

function createNetwork(node, attributeNames, depth = 0) {
    const { nodes, edges } = _createNetwork(node, attributeNames, depth);
    console.log('nodes:', nodes);
    return {
        nodes: new vis.DataSet(nodes),
        edges: new vis.DataSet(edges)
    };
}

function _createNetwork(node, attributeNames, depth) {
    if (node.type === 'innerNode') {
        return createNetworkNodesFromLeftAndRightNodeChild(node, attributeNames, depth);
    } else {
        return createNetworkNode(node.value, depth, node.id);
    }
}

function createNetworkNodesFromLeftAndRightNodeChild(node, attributeNames, depth) {
    let leftNetwork = _createNetwork(node.left, attributeNames, depth + 1);
    let rightNetwork = _createNetwork(node.right, attributeNames, depth + 1);

    let newNode = createNode(`${attributeNames[node.index]} < ${node.value}`, depth, node.id);

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

function createNetworkNode(label, depth, id) {
    return {
        nodes: [createNode(label, depth, id)],
        edges: []
    };
}

function createNode(label, depth, id) {
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
        },
        interaction: {
            hover: true,
            navigationButtons: true
        },
        edges: {
            color: {
                inherit: false
            }
        }
    };

    network = new vis.Network(container, data, options);
    // highlightNodes(data.nodes);
    // highlightEdges(data.edges);

    // add event listeners
    network.on('select', function (params) {
        document.getElementById('selection').innerHTML = 'Selection: ' + params.nodes;
    });
}

// see https://stackoverflow.com/questions/38768598/vis-js-setoptions-to-change-color-on-network-node and http://jsfiddle.net/9knw26nc/1/
function highlightNodes(allNodes, nodes) {
    nodes.forEach(node => {
        node.color = {
            border: 'red'
        };
        allNodes.update(node);
    });
}

function highlightEdges(allEdges, edges) {
    edges.forEach(edge => {
        // edge.dashes = true;
        edge.color = {
            color: 'red'
        };
        edge.arrows = 'to';
        edge.width = 2;
        allEdges.update(edge);
    });
}