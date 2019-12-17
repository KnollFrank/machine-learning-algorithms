function displayDataInput(dataInputForm, attributeNames, tree, network) {
    let dataInputFields = dataInputForm.querySelector('.dataInputFields');

    dataInputFields.innerHTML = '';
    appendInputElements(dataInputFields, attributeNames);

    dataInputForm.addEventListener(
        "submit",
        e => {
            e.preventDefault();
            const prediction = predict(tree, getInputNumbersById(attributeNames));
            const nodes = prediction.nodes.map(node => node.id);
            document.querySelector('#predicted').innerHTML = `${prediction.value}, Nodes: ${nodes.join(', ')}`;
            const networkNodes2Highlight = network.nodes.get(
                {
                    filter: function (node) {
                        return nodes.includes(node.id);
                    }
                });
            highlightNodes(network.nodes, networkNodes2Highlight);
            return false;
        });
}

function appendInputElements(parent, attributeNames) {
    attributeNames
        .map(createInputElement)
        .forEach(inputElement => parent.appendChild(inputElement));
}

function getInputNumbersById(attributeNames) {
    return attributeNames.map(getInputNumberById);
}