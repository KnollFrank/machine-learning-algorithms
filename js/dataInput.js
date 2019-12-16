function displayDataInput(dataInputForm, attributeNames, tree) {
    let dataInputFields = dataInputForm.querySelector('.dataInputFields');

    dataInputFields.innerHTML = '';
    appendInputElements(dataInputFields, attributeNames);

    dataInputForm.addEventListener(
        "submit",
        e => {
            e.preventDefault();
            const prediction = predict(tree, getInputNumbersById(attributeNames));
            const nodes = prediction.nodes.map(node => node.id).join(', ')
            document.querySelector('#predicted').innerHTML = `${prediction.value}, Nodes: ${nodes}`;
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