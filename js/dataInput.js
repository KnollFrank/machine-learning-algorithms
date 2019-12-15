function configureDataInput(dataInputForm, attributeNames, tree) {
    let dataInputFields = document.querySelector('.dataInputFields');

    appendInputElements(dataInputFields, attributeNames);

    dataInputForm.addEventListener(
        "submit",
        e => {
            e.preventDefault();
            const predicted = predict(tree, getValuesFromInputElements(attributeNames));
            document.querySelector('#predicted').innerHTML = predicted;
            return false;
        });
}

function appendInputElements(parent, attributeNames) {
    attributeNames
        .slice(0, -1)
        .map(createInputElement)
        .forEach(inputElement => parent.appendChild(inputElement));
}

function getValuesFromInputElements(attributeNames) {
    return attributeNames
        .slice(0, -1)
        .map(attributeName => Number(document.querySelector(`#${attributeName}`).value));
}