function displayTextDataInput(rootElement, attributeNames, tree, network) {
    const dataInputFields = rootElement.querySelector('.dataInputFields');

    dataInputFields.innerHTML = '';
    appendInputElements(dataInputFields, attributeNames);

    rootElement.querySelector('#dataInputForm').addEventListener(
        "submit",
        e => {
            e.preventDefault();
            const prediction = predict(tree, getInputValuesByName(attributeNames));
            highlightPredictionInNetwork(prediction, network);
            rootElement.querySelector('.prediction').innerHTML = prediction.value;
            return false;
        });
}

function displayCanvasDataInput(rootElement, canvas, tree, network) {
    rootElement.querySelector('#predict-digit').addEventListener(
        "click",
        e => {
            e.preventDefault();
            const ctx = canvas.getContext('2d');
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const pixels = imageData2Pixels(imageData);
            const prediction = predict(tree, pixels);
            highlightPredictionInNetwork(prediction, network);
            rootElement.querySelector('.prediction').innerHTML = prediction.value;
            return false;
        });
}

function highlightPredictionInNetwork(prediction, network) {
    const nodeIdsOfPrediction = prediction.nodes.map(node => node.id);
    highlightTreeNodes(network.nodes, nodeIdsOfPrediction);
    highlightTreeEdges(network.edges, nodeIdsOfPrediction);
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

function getInputValuesByName(attributeNames) {
    return attributeNames.map(getInputValueByName);
}