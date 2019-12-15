'use strict';

document.addEventListener('DOMContentLoaded', () => {
    // const dataFile = 'data/data_banknote_authentication.csv';
    const dataFile = 'data/processed.cleveland.csv';
    Papa.parse(dataFile, {
        download: true,
        header: false,
        complete: function(results) {
            onDatasetChanged(getDatasetDescription(results.data));
        }
    });
});

function getDatasetDescription(dataset) {
    let attributeNames = dataset[0];
    // remove header (= column names) of dataset
    dataset.splice(0, 1);
    return {
        attributeNames: {
            X: attributeNames.slice(0, -1),
            y: attributeNames[attributeNames.length - 1],
            get all() {
                return this.X.concat(this.y);
            }
        },
        dataset: dataset
    };
}

function onDatasetChanged(datasetDescription) {
    displayDatasetAsTable($('#datasetTable'), datasetDescription);

    let decisionTreeForm = document.querySelector('#decisionTreeForm');
    decisionTreeForm.addEventListener(
        "submit",
        e => {
            e.preventDefault();

            onDecisionTreeChanged(
                datasetDescription,
                build_tree(
                    datasetDescription.dataset,
                    getInputNumberById('max_depth'),
                    getInputNumberById('min_size')));

            return false;
        });
}

function onDecisionTreeChanged(datasetDescription, tree) {
    displayNetwork(
        document.querySelector('#decisionTreeNetwork'),
        createNetwork(tree, datasetDescription.attributeNames.X));

    displayAccuracy(tree, datasetDescription.dataset);

    displayDataInput(
        document.querySelector('#dataInputForm'),
        datasetDescription.attributeNames.X,
        tree);
}

function getInputNumberById(id) {
    return Number(document.querySelector('#' + id).value);
}

function displayAccuracy(tree, dataset) {
    const accuracy = computeAccuracy(tree, dataset);
    document.querySelector('#accuracy').innerHTML = `${Math.floor(accuracy)}%`;
}

function computeAccuracy(tree, dataset) {
    const predicted = dataset.map(row => predict(tree, row));
    return accuracy_percentage(actualClassVals(dataset), predicted);
}