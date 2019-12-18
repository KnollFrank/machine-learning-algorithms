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

function highlightTreeEdges(networkEdges, nodeIds2Highlight) {
    const networkEdges2Highlight = [];
    for (const [fromId, toId] of getConsecutiveNodes(nodeIds2Highlight)) {
        networkEdges2Highlight.push(getNetworkEdge(networkEdges, fromId, toId));
    }

    highlightEdges(networkEdges, networkEdges2Highlight);
}

function* getConsecutiveNodes(nodes) {
    for (let i = 0; i < nodes.length - 1; i++) {
        yield [nodes[i], nodes[i + 1]];
    }
}

function getNetworkEdge(networkEdges, fromId, toId) {
    return networkEdges.get({
        filter: networkEdge => networkEdge.from == fromId && networkEdge.to == toId
    })[0];
}

function appendInputElements(parent, attributeNames) {
    attributeNames
        .map(createInputElement)
        .forEach(inputElement => parent.appendChild(inputElement));
}

function getInputNumbersById(attributeNames) {
    return attributeNames.map(getInputNumberById);
}