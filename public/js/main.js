'use strict';

// FK-TODO: verwende import export
// see https://www.joyofdata.de/blog/parsing-local-csv-file-with-javascript-papa-parse/

document.addEventListener('DOMContentLoaded', () => {
    document.querySelector('#csv-file').addEventListener('change', evt => {
        // const dataFile = 'data/data_banknote_authentication.csv';
        // const dataFile = 'data/processed.cleveland.csv';
        const dataFile = evt.target.files[0];

        Papa.parse(dataFile, {
            download: true,
            header: false,
            complete: function(results) {
                onDatasetChanged(getDatasetDescription(results.data));
            }
        });
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
    displayDatasetAsTable($('#datasetTableContainer'), datasetDescription);

    let decisionTreeForm = document.querySelector('#decisionTreeForm');
    decisionTreeForm.addEventListener(
        "submit",
        e => {
            e.preventDefault();

            onDecisionTreeChanged(
                datasetDescription,
                new DecisionTreeBuilder(
                    getInputValueById('max_depth'),
                    getInputValueById('min_size'), {
                        onNodeAdded: function(node) {},
                        onEdgeAdded: function(fromNode, toNode) {}
                    })
                .build_tree(datasetDescription.dataset));

            return false;
        });
}

function onDecisionTreeChanged(datasetDescription, tree) {
    const network = new NetworkBuilder(datasetDescription.attributeNames.X).createNetwork(tree);
    displayNetwork(document.querySelector('#decisionTreeNetwork'), network);

    print_tree(tree, datasetDescription.attributeNames.all);

    displayAccuracy(tree, datasetDescription.dataset);

    displayDataInput(
        document.querySelector('#dataInputForm'),
        datasetDescription.attributeNames.X,
        tree,
        network);
}

function getInputValueById(id) {
    return getInputValueBy('#' + id);
}

function getInputValueByName(name) {
    return getInputValueBy(`input[name="${name}"]`);
}

function getInputValueBy(selectors) {
    return document.querySelector(selectors).value;
}

function displayAccuracy(tree, dataset) {
    const accuracy = computeAccuracy(tree, dataset);
    document.querySelector('#accuracy').innerHTML = `${Math.floor(accuracy)}%`;
}

function computeAccuracy(tree, dataset) {
    const predicted = dataset.map(row => predict(tree, row).value);
    return accuracy_percentage(actualClassVals(dataset), predicted);
}