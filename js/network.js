'use strict';

function createNetwork(node, attributeNames, depth = 0) {
    const { nodes, edges } = _createNetwork(node, attributeNames, depth);
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
    nodes: {
        borderWidth: 1,
        color: {
            border: '#2B7CE9'
        }
    },
    edges: {
        color: {
            inherit: false,
            color: '#2B7CE9'
        },
        width: 1
    }
};

function displayNetwork(container, data) {
    destroyNetwork();

    network = new vis.Network(container, data, options);

    network.on('select', function(params) {
        document.getElementById('selection').innerHTML = 'Selection: ' + params.nodes;
    });
}

// see https://stackoverflow.com/questions/38768598/vis-js-setoptions-to-change-color-on-network-node and http://jsfiddle.net/9knw26nc/1/
function highlightNodes(allNodes, nodes) {
    resetAllNodeOptionsToDefault(allNodes);
    _highlightNodes(allNodes, nodes);
}

function resetAllNodeOptionsToDefault(allNodes) {
    updateNodes(
        allNodes,
        allNodes,
        node => {
            setNodeColor(node, options.nodes.color.border);
            setNodeBorderWidth(node, options.nodes.borderWidth);
        });
}

function _highlightNodes(allNodes, nodes) {
    updateNodes(
        nodes,
        allNodes,
        node => {
            setNodeColor(node, 'red');
            setNodeBorderWidth(node, 2);
        });
}

function updateNodes(nodes, allNodes, updateNode) {
    nodes.forEach(node => {
        updateNode(node);
        allNodes.update(node);
    });
}

function setNodeColor(node, color) {
    node.color = {
        border: color
    };
}

function setNodeBorderWidth(node, width) {
    node.borderWidth = width;
}

function highlightEdges(allEdges, edges) {
    resetAllEdgeOptionsToDefault(allEdges);
    _highlightEdges(allEdges, edges);
}

function resetAllEdgeOptionsToDefault(allEdges) {
    updateEdges(allEdges, allEdges, edge => {
        setEdgeColor(edge, options.edges.color.color);
        delete edge.arrows;
        setEdgeWidth(edge, options.edges.width);
    });
}

function _highlightEdges(allEdges, edges) {
    updateEdges(edges, allEdges, edge => {
        setEdgeColor(edge, 'red');
        edge.arrows = 'to';
        setEdgeWidth(edge, 2);
    });
}

function updateEdges(edges, allEdges, updateEdge) {
    edges.forEach(edge => {
        updateEdge(edge);
        allEdges.update(edge);
    });
}

function setEdgeColor(edge, color) {
    edge.color = {
        color: color
    };
}

function setEdgeWidth(edge, width) {
    edge.width = width;
}