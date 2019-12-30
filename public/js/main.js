'use strict';

// FK-TODO: verwende import export
// see https://www.joyofdata.de/blog/parsing-local-csv-file-with-javascript-papa-parse/

document.addEventListener('DOMContentLoaded', () => {
    $('#section-traindata, #section-decision-tree, #section-data-input, #section-testdata').hide();
    document.querySelector('#csv-file').addEventListener('change', evt => {
        // const dataFile = 'data/data_banknote_authentication.csv';
        // const dataFile = 'data/processed.cleveland.csv';
        const dataFile = evt.target.files[0];

        Papa.parse(dataFile, {
            download: true,
            header: false,
            complete: function(results) {
                onDatasetChanged(getDatasetDescription(dataFile.name, results.data));
            }
        });
    });
});

function getDatasetDescription(fileName, dataset) {
    let attributeNames = dataset[0];
    // remove header (= column names) of dataset
    dataset.splice(0, 1);
    return {
        fileName: fileName,
        attributeNames: {
            X: attributeNames.slice(0, -1),
            y: attributeNames[attributeNames.length - 1],
            get all() {
                return this.X.concat(this.y);
            }
        },
        splittedDataset: train_test_split(dataset, 0.8)
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
    $('#section-traindata, #section-decision-tree').show();
    $('#progress, #decisionTreeNetwork').hide();
    $('#section-data-input, #section-testdata').hide();
    if (isDigitDataset(datasetDescription)) {
        $('#container-digits-train').show();
        $('#container-trainingDataSet').hide();
        displayDigitTrainDataset(datasetDescription, 'container-digits-train');
    } else {
        $('#container-digits-train').hide();
        $('#container-trainingDataSet').show();
        displayDatasetAsTable({
            tableContainer: $('#container-trainingDataSet'),
            attributeNames: datasetDescription.attributeNames.all,
            dataset: datasetDescription.splittedDataset.train
        });
    }
    build_tree_onSubmit(datasetDescription);
    configure_load_tree(datasetDescription);
}

function isDigitDataset(datasetDescription) {
    return datasetDescription.fileName.toLowerCase().startsWith('mnist');
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
        dataset: datasetDescription.splittedDataset.train,
        max_depth: getInputValueById('max_depth'),
        min_size: getInputValueById('min_size')
    }, ({ type: type, value: value }) => {
        switch (type) {
            case 'info':
                gNetwork = addNewNodesAndEdgesToNetwork(datasetDescription, value, gNetwork);
                break;
            case 'inner-split':
                const {
                    workerIndex,
                    nodeId,
                    startSplitIndex,
                    actualSplitIndex,
                    endSplitIndex,
                    numberOfEntriesInDataset
                } = value;
                displayProgress({
                    workerIndex,
                    nodeId,
                    startSplitIndex,
                    actualSplitIndex,
                    endSplitIndex,
                    numberOfEntriesInDataset,
                    attributeNames: datasetDescription.attributeNames.X
                });
                break;
            case 'result':
                onDecisionTreeChanged(datasetDescription, value);
                break;
        }
    });
}

function build_tree_with_worker({ dataset, max_depth, min_size }, onmessage) {
    $('#progress, #decisionTreeNetwork').show();
    createProgressElements('progress', splitterWorkers.length);
    new DecisionTreeBuilder(
            max_depth,
            min_size,
            splitterWorkers,
            createTreeListener(onmessage))
        .build_tree(
            dataset,
            tree => onmessage({ type: 'result', value: tree }));
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

function displayProgress({
    workerIndex,
    nodeId,
    startSplitIndex,
    actualSplitIndex,
    endSplitIndex,
    numberOfEntriesInDataset,
    attributeNames
}) {
    setProgressText(workerIndex, `Worker ${workerIndex + 1}, Node: ${nodeId}, Step: ${startSplitIndex} (${attributeNames[startSplitIndex]}) <= ${actualSplitIndex} (${attributeNames[actualSplitIndex]}) <= ${endSplitIndex} (${attributeNames[endSplitIndex]}), size of dataset: ${numberOfEntriesInDataset}`);
    setProgress({
        workerIndex: workerIndex,
        value: actualSplitIndex - startSplitIndex + 1,
        max: endSplitIndex - startSplitIndex + 1
    });
}

function onDecisionTreeChanged(datasetDescription, tree) {
    $('#decisionTreeNetwork, #section-data-input, #section-testdata').show();
    const network = new NetworkBuilder(datasetDescription.attributeNames.X).createNetwork(tree);
    displayNetwork(document.querySelector('#decisionTreeNetwork'), network);
    print_tree(tree, datasetDescription.attributeNames.all);
    configure_save_tree(tree);
    displayAccuracy(tree, datasetDescription.splittedDataset.test);
    displayTestingTableWithPredictions(tree, network, datasetDescription);

    const canvasDataInput = document.querySelector('#canvas-data-input');
    const textDataInput = document.querySelector('#text-data-input');
    if (isDigitDataset(datasetDescription)) {
        canvasDataInput.style.display = "block";
        textDataInput.style.display = "none";

        displayCanvasDataInput(
            canvasDataInput,
            tree,
            network);
    } else {
        canvasDataInput.style.display = "none";
        textDataInput.style.display = "block";

        displayTextDataInput(
            textDataInput,
            datasetDescription.attributeNames.X,
            tree,
            network);
    }
}

const localStorageTreeKey = 'tree';

function configure_load_tree(datasetDescription) {
    const load_tree = document.querySelector('#load_tree');
    load_tree.addEventListener('click', () => {
        const tree = JSON.parse(localStorage.getItem(localStorageTreeKey))
        onDecisionTreeChanged(datasetDescription, tree);
    });
}

function configure_save_tree(tree) {
    const save_tree = document.querySelector('#save_tree');
    save_tree.addEventListener('click', () =>
        localStorage.setItem(localStorageTreeKey, JSON.stringify(tree))
    );
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

function displayTestingTableWithPredictions(tree, network, datasetDescription) {
    function addPredictionAttribute(attributeNames) {
        const lastAttributeName = attributeNames[attributeNames.length - 1];
        return attributeNames.concat('prediction for ' + lastAttributeName);
    }

    const addPrediction2Row = row => row.concat(predict(tree, row).value);
    const addPredictions = rows => rows.map(addPrediction2Row);

    function markRowIfItsPredictionIsWrong(row, data) {
        const isRowsPredictionWrong = data[data.length - 2] != data[data.length - 1];
        const markRow = () => $(row).find("td").addClass('wrongPrediction');

        if (isRowsPredictionWrong) {
            markRow();
        }
    }

    if (isDigitDataset(datasetDescription)) {
        $('#container-digits-test').show();
        $('#container-testDataSet').hide();
        displayDigitTestDataset(datasetDescription, tree, 'container-digits-test');
    } else {
        $('#container-digits-test').hide();
        $('#container-testDataSet').show();
        displayDatasetAsTable({
            tableContainer: $('#container-testDataSet'),
            attributeNames: addPredictionAttribute(datasetDescription.attributeNames.all),
            dataset: addPredictions(datasetDescription.splittedDataset.test),
            createdRow: markRowIfItsPredictionIsWrong,
            onRowClicked: row => predictRowAndHighlightInNetwork(row, tree, network, datasetDescription)
        });
    }
}

function predictRowAndHighlightInNetwork(row, tree, network, datasetDescription) {
    const independentValsFromRow = row.slice(0, datasetDescription.attributeNames.X.length);
    highlightPredictionInNetwork(predict(tree, independentValsFromRow), network);
}

function createTreeListener(onmessage) {
    const timedExecutor = new TimedExecutor(100);
    let rootNode;
    return {
        onNodeAdded: node => {
            if (!rootNode) {
                rootNode = node;
            }
            timedExecutor.execute(() => onmessage({ type: 'info', value: rootNode }));
        },
        onEdgeAdded: (fromNode, toNode) => {
            timedExecutor.execute(() => onmessage({ type: 'info', value: rootNode }));
        },
        onStartSplit: nodeId => {},
        onInnerSplit: ({ workerIndex, nodeId, startSplitIndex, actualSplitIndex, endSplitIndex, numberOfEntriesInDataset }) => {
            onmessage({ type: 'inner-split', value: { workerIndex, nodeId, startSplitIndex, actualSplitIndex, endSplitIndex, numberOfEntriesInDataset } });
        },
        onEndSplit: nodeId => {}
    }
}