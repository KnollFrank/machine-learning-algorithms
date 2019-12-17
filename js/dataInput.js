function displayDataInput(dataInputForm, attributeNames, tree, network) {
    let dataInputFields = dataInputForm.querySelector('.dataInputFields');

    dataInputFields.innerHTML = '';
    appendInputElements(dataInputFields, attributeNames);

    dataInputForm.addEventListener(
        "submit",
        e => {
            e.preventDefault();
            const prediction = predict(tree, getInputNumbersById(attributeNames));
            const nodeIdsOfPrediction = prediction.nodes.map(node => node.id);
            highlightTreeNodes(network.nodes, nodeIdsOfPrediction);
            highlightTreeEdges(network.edges, nodeIdsOfPrediction);
            document.querySelector('#predicted').innerHTML = `${prediction.value}, Nodes: ${nodeIdsOfPrediction.join(', ')}`;
            return false;
        });
}

function highlightTreeNodes(networkNodes, nodeIds2Highlight) {
    const networkNodes2Highlight = networkNodes.get({ filter: networkNode => nodeIds2Highlight.includes(networkNode.id) });
    highlightNodes(networkNodes, networkNodes2Highlight);
}

// TODO: refactor
function highlightTreeEdges(networkEdges, nodeIds2Highlight) {
    const networkEdges2Highlight = [];
    for (let i = 0; i < nodeIds2Highlight.length - 1; i++) {
        const networkEdge = getNetworkEdge(networkEdges, nodeIds2Highlight[i], nodeIds2Highlight[i + 1]);
        networkEdges2Highlight.push(networkEdge);
    }
    highlightEdges(networkEdges, networkEdges2Highlight);
}

function getNetworkEdge(networkEdges, id1, id2) {
    return networkEdges.get({
        filter: networkEdge => isNetworkEdgeBetweenNodeIds(networkEdge, id1, id2)
    })[0];
}

function isNetworkEdgeBetweenNodeIds(networkEdge, nodeId1, nodeId2) {
    const isNetworkEdgeFromTo = (fromId, toId) => networkEdge.from == fromId && networkEdge.to == toId;

    return isNetworkEdgeFromTo(nodeId1, nodeId2) || isNetworkEdgeFromTo(nodeId2, nodeId1);
}

function appendInputElements(parent, attributeNames) {
    attributeNames
        .map(createInputElement)
        .forEach(inputElement => parent.appendChild(inputElement));
}

function getInputNumbersById(attributeNames) {
    return attributeNames.map(getInputNumberById);
}