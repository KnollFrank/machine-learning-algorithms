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
    if (isDigitDataset(datasetDescription)) {
        displayDigitTrainDataset(datasetDescription, 'container-digits-train');
    } else {
        displayDatasetAsTable({
            tableContainer: $('#container-trainingDataSet'),
            attributeNames: datasetDescription.attributeNames.all,
            dataset: datasetDescription.splittedDataset.train
        });
    }
    build_tree_onSubmit(datasetDescription);
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
    const numWorkers = window.navigator.hardwareConcurrency;
    createProgressElements('progress', numWorkers);
    new DecisionTreeBuilder(
            max_depth,
            min_size,
            numWorkers,
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
    setProgressText(workerIndex, `Worker ${workerIndex}, Node: ${nodeId}, Step: ${startSplitIndex} (${attributeNames[startSplitIndex]}) <= ${actualSplitIndex} (${attributeNames[actualSplitIndex]}) <= ${endSplitIndex} (${attributeNames[endSplitIndex]}), size of dataset: ${numberOfEntriesInDataset}`);
    setProgress({
        workerIndex: workerIndex,
        value: actualSplitIndex - startSplitIndex + 1,
        max: endSplitIndex - startSplitIndex + 1
    });
}

function onDecisionTreeChanged(datasetDescription, tree) {
    const network = new NetworkBuilder(datasetDescription.attributeNames.X).createNetwork(tree);
    displayNetwork(document.querySelector('#decisionTreeNetwork'), network);
    print_tree(tree, datasetDescription.attributeNames.all);
    displayAccuracy(tree, datasetDescription.splittedDataset.test);
    displayTestingTableWithPredictions(tree, network, datasetDescription);
    const canvas = drawTool();
    displayDataInput(
        canvas,
        document.querySelector('#dataInputForm'),
        datasetDescription.attributeNames.X,
        tree,
        network);
}

function drawTool() {
    const canvas = document.getElementById('digit-canvas');
    const ctx = canvas.getContext('2d');
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 3;
    ctx.lineJoin = ctx.lineCap = 'round';
    let last_mouse = { x: 0, y: 0 };
    let mouse = { x: 0, y: 0 };
    let mousedown = false;

    // taken from https://stackoverflow.com/questions/17130395/real-mouse-position-in-canvas
    function getMousePos(canvas, evt) {
        const rect = canvas.getBoundingClientRect(), // abs. size of element
            scaleX = canvas.width / rect.width, // relationship bitmap vs. element for X
            scaleY = canvas.height / rect.height; // relationship bitmap vs. element for Y

        return {
            x: (evt.clientX - rect.left) * scaleX, // scale mouse coordinates after they have
            y: (evt.clientY - rect.top) * scaleY // been adjusted to be relative to element
        }
    }

    $(canvas).on('mousedown', function(e) {
        last_mouse = mouse = getMousePos(canvas, e);
        mousedown = true;
    });

    $(canvas).on('mouseup', function(e) {
        mousedown = false;
    });

    $(canvas).on('mousemove', function(e) {
        mouse = getMousePos(canvas, e);
        if (mousedown) {
            ctx.beginPath();
            ctx.moveTo(last_mouse.x, last_mouse.y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.stroke();
        }
        last_mouse = mouse;
    });

    return canvas;
}

function printImageData(imageData) {
    for (let y = 0; y < imageData.height; y++) {
        for (let x = 0; x < imageData.width; x++) {
            const i = y * imageData.width + x;
            const red = imageData.data[i * 4 + 0];
            const green = imageData.data[i * 4 + 1];
            const blue = imageData.data[i * 4 + 2];
            const alpha = imageData.data[i * 4 + 3];
            console.log('RGBA:', red, green, blue, alpha);
        }
    }
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
        displayDigitTestDataset(datasetDescription, tree, 'container-digits-test');
    } else {
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