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
            build_tree_with_worker({
                    dataset: datasetDescription.dataset,
                    max_depth: getInputValueById('max_depth'),
                    min_size: getInputValueById('min_size')
                },
                result => {
                    switch (result.type) {
                        case 'result':
                            {
                                const tree = result.value;
                                onDecisionTreeChanged(datasetDescription, tree);
                                break;
                            }
                        case 'info':
                            {
                                const tree = result.value;
                                console.log('info from worker:', tree);
                                const network = new NetworkBuilder(datasetDescription.attributeNames.X).createNetwork(tree);
                                displayNetwork(document.querySelector('#decisionTreeNetwork'), network);
                            }
                    }
                });
            return false;
        });
}

function build_tree_with_worker(data, onmessage) {
    const worker = new Worker('js/decisionTreeWorker.js');
    worker.onmessage = event => onmessage(event.data);
    worker.postMessage(data);
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