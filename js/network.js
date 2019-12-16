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
        },
        interaction: {
            hover: true,
            navigationButtons: true
        }
    };

    const nodes = new vis.DataSet(data.nodes);

    network = new vis.Network(container, { nodes: nodes, edges: data.edges }, options);

    // add event listeners
    network.on('select', function (params) {
        document.getElementById('selection').innerHTML = 'Selection: ' + params.nodes;
    });

    // see https://stackoverflow.com/questions/38768598/vis-js-setoptions-to-change-color-on-network-node and http://jsfiddle.net/9knw26nc/1/
    network.on("select", function (params) {
        const nodeID = params['nodes']['0'];
        if (nodeID) {
            const clickedNode = nodes.get(nodeID);
            clickedNode.color = {
                border: '#000000',
                background: '#000000',
                highlight: {
                    border: '#2B7CE9',
                    background: '#D2E5FF'
                }
            };
            nodes.update(clickedNode);
        }
    });
}