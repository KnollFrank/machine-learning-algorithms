'use strict';

// FK-TODO: verwende import export
// see https://www.joyofdata.de/blog/parsing-local-csv-file-with-javascript-papa-parse/

const ClassifierType = Object.freeze({ DECISION_TREE: 'DECISION_TREE', KNN: 'KNN' });

document.addEventListener('DOMContentLoaded', () => {
    const classifierType = ClassifierType.KNN;
    setH1(classifierType);
    $('#section-traindata, #section-decision-tree, #section-KNN, #section-data-input, #section-testdata').fadeOut();
    document.querySelector('#csv-file').addEventListener('change', evt => {
        // const dataFile = 'data/data_banknote_authentication.csv';
        // const dataFile = 'data/processed.cleveland.csv';
        const dataFile = evt.target.files[0];

        Papa.parse(dataFile, {
            download: true,
            header: false,
            complete: function (results) {
                onDatasetChanged(getDatasetDescription(dataFile.name, results.data), classifierType);
            }
        });
    });
});

function setH1(classifierType) {
    document.querySelector('h1').textContent = getH1(classifierType);
}

function getH1(classifierType) {
    return classifierType == ClassifierType.DECISION_TREE ?
        'Entscheidungsbäume' :
        'k nächste Nachbarn';
}

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

function onDatasetChanged(datasetDescription, classifierType) {
    showSectionFor(classifierType);
    $('#section-traindata').fadeIn();
    $('#progress, #subsection-decision-tree').fadeOut();
    $('#section-data-input, #section-testdata').fadeOut();
    if (isDigitDataset(datasetDescription)) {
        $('#container-digits-train').fadeIn();
        $('#container-trainingDataSet').fadeOut();
        displayDigitTrainDataset(datasetDescription, 'container-digits-train');
    } else {
        $('#container-digits-train').fadeOut();
        $('#container-trainingDataSet').fadeIn();
        displayDatasetAsTable({
            tableContainer: $('#container-trainingDataSet'),
            attributeNames: datasetDescription.attributeNames.all,
            dataset: datasetDescription.splittedDataset.train
        });
    }
    build_classifier_onSubmit(datasetDescription, classifierType);
    configure_load_tree(datasetDescription);
}

function showSectionFor(classifierType) {
    if (classifierType == ClassifierType.DECISION_TREE) {
        $('#section-decision-tree').fadeIn();
        $('#section-KNN').fadeOut();
    }
    else {
        $('#section-decision-tree').fadeOut();
        $('#section-KNN').fadeIn();
    }
}

function isDigitDataset(datasetDescription) {
    return datasetDescription.fileName.toLowerCase().startsWith('mnist');
}

let submitEventListener;

function build_classifier_onSubmit(datasetDescription, classifierType) {
    let decisionTreeForm = document.querySelector('#decisionTreeForm');
    if (submitEventListener) {
        decisionTreeForm.removeEventListener("submit", submitEventListener);
    }
    submitEventListener = e => {
        e.preventDefault();
        build_classifier(datasetDescription, classifierType);
        return false;
    }
    if (classifierType == ClassifierType.DECISION_TREE) {
        decisionTreeForm.addEventListener("submit", submitEventListener);
    } else {
        document.querySelector('#calculate-KNN').addEventListener('click', submitEventListener);
    }
}

function build_classifier(datasetDescription, classifierType) {
    switch (classifierType) {
        case ClassifierType.DECISION_TREE:
            build_tree(datasetDescription);
            break;
        case ClassifierType.KNN:
            const knn = new KNN(1);
            knn.fit(
                datasetDescription.splittedDataset.train.map(row => getIndependentValsFromRow(row, datasetDescription)),
                datasetDescription.splittedDataset.train.map(getClassValFromRow));
            onClassifierBuilt(datasetDescription, knn, classifierType);
            break;
    }
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
                    startSplitIndex,
                    actualSplitIndex,
                    endSplitIndex,
                    numberOfEntriesInDataset
                } = value;
                displayProgress({
                    workerIndex,
                    startSplitIndex,
                    actualSplitIndex,
                    endSplitIndex,
                    actualNumberOfEntriesInDataset: numberOfEntriesInDataset,
                    maxNumberOfEntriesInDataset: datasetDescription.splittedDataset.train.length,
                    attributeNames: datasetDescription.attributeNames.X
                });
                break;
            case 'result':
                $('#progress').fadeOut();
                onClassifierBuilt(datasetDescription, value, ClassifierType.DECISION_TREE);
                break;
        }
    });
}

function build_tree_with_worker({ dataset, max_depth, min_size }, onmessage) {
    $('#progress, #subsection-decision-tree').fadeIn();
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
        gNetwork = createNetwork(datasetDescription, tree, new SimpleNodeContentFactory());
        displayNetwork(document.querySelector('#decisionTreeNetwork'), gNetwork);
    }
    const network = createNetwork(datasetDescription, tree, new SimpleNodeContentFactory());

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

function createNetwork(datasetDescription, tree, nodeContentFactory) {
    return new NetworkBuilder(datasetDescription.attributeNames.X, nodeContentFactory).createNetwork(tree);
}

function displayProgress({
    workerIndex,
    startSplitIndex,
    actualSplitIndex,
    endSplitIndex,
    actualNumberOfEntriesInDataset,
    maxNumberOfEntriesInDataset,
    attributeNames
}) {
    setProgress_numberOfEntriesInDataset({
        value: actualNumberOfEntriesInDataset,
        max: maxNumberOfEntriesInDataset
    });
    setProgress_workerId(workerIndex, workerIndex + 1);
    setProgress_progress({
        workerIndex: workerIndex,
        value: actualSplitIndex - startSplitIndex + 1,
        text: attributeNames[actualSplitIndex],
        max: endSplitIndex - startSplitIndex + 1
    });
    setProgress_startAttribute(workerIndex, attributeNames[startSplitIndex]);
    setProgress_endAttribute(workerIndex, attributeNames[endSplitIndex]);
}

function onClassifierBuilt(datasetDescription, classifier, classifierType) {
    switch (classifierType) {
        case ClassifierType.DECISION_TREE:
            onDecisionTreeChanged(datasetDescription, classifier);
            break;
        case ClassifierType.KNN:
            $('#subsection-decision-tree, #section-data-input, #section-testdata').fadeIn();
            const rowClassifier = getRowClassifier(ClassifierType.KNN, classifier, datasetDescription);
            displayAccuracy(
                rowClassifier,
                datasetDescription.splittedDataset.test);
            displayTestingTableWithPredictions(rowClassifier, ClassifierType.KNN, network, classifier, datasetDescription);
            const canvasDataInput = document.querySelector('#canvas-data-input');
            const textDataInput = document.querySelector('#text-data-input');
            displayDataInput(datasetDescription, canvasDataInput, textDataInput, classifier, network, rowClassifier, ClassifierType.KNN);
            break;
    }
}

function getRowClassifier(classifierType, classifier, datasetDescription) {
    switch (classifierType) {
        case ClassifierType.DECISION_TREE:
            return row => predict(classifier, row).value;
        case ClassifierType.KNN:
            return row => classifier.predict(getIndependentValsFromRow(row, datasetDescription));
    }
}

function onDecisionTreeChanged(datasetDescription, tree) {
    const switcher = document.querySelector('#decisionTreeNetwork-enhanced-switcher input[type=checkbox]');
    const __onDecisionTreeChanged = () =>
        _onDecisionTreeChanged(
            datasetDescription,
            tree,
            switcher.checked ?
                new EnhancedNodeContentFactory() :
                new SimpleNodeContentFactory());
    switcher.addEventListener('change', __onDecisionTreeChanged);
    __onDecisionTreeChanged();
}

function _onDecisionTreeChanged(datasetDescription, tree, nodeContentFactory) {
    $('#subsection-decision-tree, #section-data-input, #section-testdata').fadeIn();
    const network = createAndDisplayNetwork(datasetDescription, tree, nodeContentFactory);
    print_tree(tree, datasetDescription.attributeNames.all);
    configure_save_tree(tree);
    const rowClassifier = getRowClassifier(ClassifierType.DECISION_TREE, tree, datasetDescription);
    displayAccuracy(
        rowClassifier,
        datasetDescription.splittedDataset.test);
    displayTestingTableWithPredictions(rowClassifier, ClassifierType.DECISION_TREE, network, tree, datasetDescription);
    const canvasDataInput = document.querySelector('#canvas-data-input');
    const textDataInput = document.querySelector('#text-data-input');
    displayDataInput(datasetDescription, canvasDataInput, textDataInput, tree, network, rowClassifier, ClassifierType.DECISION_TREE);
}

function displayDataInput(datasetDescription, canvasDataInput, textDataInput, tree, network, rowClassifier, classifierType) {
    if (isDigitDataset(datasetDescription)) {
        canvasDataInput.style.display = "block";
        textDataInput.style.display = "none";
        displayCanvasDataInput(canvasDataInput, tree, network, rowClassifier, classifierType);
    } else {
        canvasDataInput.style.display = "none";
        textDataInput.style.display = "block";
        displayTextDataInput(textDataInput, datasetDescription.attributeNames.X, tree, network, rowClassifier, classifierType);
    }
}

function createAndDisplayNetwork(datasetDescription, tree, nodeContentFactory) {
    const network = createNetwork(datasetDescription, tree, nodeContentFactory);
    displayNetwork(document.querySelector('#decisionTreeNetwork'), network);
    return network;
}

const localStorageTreeKey = 'tree';

function configure_load_tree(datasetDescription) {
    const load_tree = document.querySelector('#load_tree');
    load_tree.addEventListener('click', () => {
        const tree = JSON.parse(localStorage.getItem(localStorageTreeKey))
        onClassifierBuilt(datasetDescription, tree, ClassifierType.DECISION_TREE);
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
    return getInputValueBy(`input[name = "${name}"]`);
}

function getInputValueBy(selectors) {
    return document.querySelector(selectors).value;
}

function displayAccuracy(rowClassifier, dataset) {
    const accuracy = computeAccuracy(rowClassifier, dataset);
    document.querySelector('#accuracy').innerHTML = `${Math.floor(accuracy)}%`;
}

function computeAccuracy(rowClassifier, dataset) {
    return accuracy_percentage(actualClassVals(dataset), dataset.map(rowClassifier));
}

function displayTestingTableWithPredictions(rowClassifier, classifierType, network, tree, datasetDescription) {
    function addPredictionAttribute(attributeNames) {
        const lastAttributeName = attributeNames[attributeNames.length - 1];
        return attributeNames.concat('prediction for ' + lastAttributeName);
    }

    const addPrediction2Row = row => row.concat(rowClassifier(row));
    const addPredictions = rows => rows.map(addPrediction2Row);

    function markRowIfItsPredictionIsWrong(row, data) {
        const isRowsPredictionWrong = data[data.length - 2] != data[data.length - 1];
        const markRow = () => $(row).find("td").addClass('wrongPrediction');

        if (isRowsPredictionWrong) {
            markRow();
        }
    }

    if (isDigitDataset(datasetDescription)) {
        $('#container-digits-test').fadeIn();
        $('#container-testDataSet').fadeOut();
        const onDigitClickedReceiveRow =
            classifierType == ClassifierType.DECISION_TREE ?
                row => predictRowAndHighlightInNetwork(row, tree, network, datasetDescription) :
                row => { };
        displayDigitTestDataset({
            datasetDescription: datasetDescription,
            rowClassifier: rowClassifier,
            digitsContainerId: 'container-digits-test',
            onDigitClickedReceiveRow: onDigitClickedReceiveRow
        });
    } else {
        $('#container-digits-test').fadeOut();
        $('#container-testDataSet').fadeIn();
        const onRowClicked =
            classifierType == ClassifierType.DECISION_TREE ?
                row => predictRowAndHighlightInNetwork(row, tree, network, datasetDescription) :
                row => { };
        displayDatasetAsTable({
            tableContainer: $('#container-testDataSet'),
            attributeNames: addPredictionAttribute(datasetDescription.attributeNames.all),
            dataset: addPredictions(datasetDescription.splittedDataset.test),
            createdRow: markRowIfItsPredictionIsWrong,
            onRowClicked: onRowClicked
        });
    }
}

function predictRowAndHighlightInNetwork(row, tree, network, datasetDescription) {
    highlightPredictionInNetwork(
        predict(tree, getIndependentValsFromRow(row, datasetDescription)),
        network);
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
        onStartSplit: nodeId => { },
        onInnerSplit: ({ workerIndex, nodeId, startSplitIndex, actualSplitIndex, endSplitIndex, numberOfEntriesInDataset }) => {
            onmessage({ type: 'inner-split', value: { workerIndex, startSplitIndex, actualSplitIndex, endSplitIndex, numberOfEntriesInDataset } });
        },
        onEndSplit: nodeId => { }
    }
}