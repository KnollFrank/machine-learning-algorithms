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

function train_test_split(dataset, train_proportion) {
    const end = train_proportion * dataset.length;
    return {
        train: dataset.slice(0, end),
        test: dataset.slice(end)
    };
}

function onDatasetChanged(datasetDescription) {
    displayDatasetAsTable($('#datasetTableContainer'), datasetDescription);
    build_tree_onSubmit(datasetDescription);
}

let submitEventListener;

function build_tree_onSubmit(datasetDescription) {
    let decisionTreeForm = document.querySelector('#decisionTreeForm');
    if (submitEventListener) {
        decisionTreeForm.removeEventListener("submit", submitEventListener);
    }
    submitEventListener = e => {
        e.preventDefault();
        build_tree(datasetDescription);
        return false;
    }
    decisionTreeForm.addEventListener("submit", submitEventListener);
}

function build_tree(datasetDescription) {
    let gNetwork;
    build_tree_with_worker({
        dataset: datasetDescription.dataset,
        max_depth: getInputValueById('max_depth'),
        min_size: getInputValueById('min_size')
    }, ({ type: type, value: value }) => {
        switch (type) {
            case 'info':
                gNetwork = addNewNodesAndEdgesToNetwork(datasetDescription, value, gNetwork);
                break;
            case 'inner-split':
                displayProgress(value);
                break;
            case 'result':
                onDecisionTreeChanged(datasetDescription, value);
                break;
        }
    });
}

function build_tree_with_worker(data, onmessage) {
    const worker = new Worker('js/decisionTreeWorker.js');
    worker.onmessage = event => onmessage(event.data);
    worker.postMessage(data);
}

function addNewNodesAndEdgesToNetwork(datasetDescription, tree, gNetwork) {
    if (!gNetwork) {
        gNetwork = new NetworkBuilder(datasetDescription.attributeNames.X).createNetwork(tree);
        displayNetwork(document.querySelector('#decisionTreeNetwork'), gNetwork);
    }
    const network = new NetworkBuilder(datasetDescription.attributeNames.X).createNetwork(tree);

    const newNodes = network.nodes.get({
        filter: node => gNetwork.nodes.get(node.id) === null
    });
    gNetwork.nodes.add(newNodes);

    const newEdges = network.edges.get({
        filter: edge => gNetwork.edges.get(edge.id) === null
    });
    gNetwork.edges.add(newEdges);
    return gNetwork;
}

function displayProgress({ nodeId, actualSplitIndex, endSplitIndex, numberOfEntriesInDataset }) {
    const text = document.querySelector('#progress-text');
    text.textContent = `Node: ${nodeId}, Step: ${actualSplitIndex + 1}/${endSplitIndex + 1}, Number of entries in actual dataset: ${numberOfEntriesInDataset}`;

    const progress = document.querySelector('#progress-build-decision-tree');
    progress.value = actualSplitIndex;
    progress.max = endSplitIndex;
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