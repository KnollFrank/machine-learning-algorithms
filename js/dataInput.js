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
            document.querySelector('#predicted').innerHTML = `${prediction.value}, Nodes: ${nodeIdsOfPrediction.join(', ')}`;
            return false;
        });
}

function highlightTreeNodes(networkNodes, nodeIds2Highlight) {
    const networkNodes2Highlight = networkNodes.get({ filter: networkNode => nodeIds2Highlight.includes(networkNode.id) });
    highlightNodes(networkNodes, networkNodes2Highlight);
}

function appendInputElements(parent, attributeNames) {
    attributeNames
        .map(createInputElement)
        .forEach(inputElement => parent.appendChild(inputElement));
}

function getInputNumbersById(attributeNames) {
    return attributeNames.map(getInputNumberById);
}