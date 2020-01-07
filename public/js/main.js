'use strict';

// FK-TODO: verwende import export
// see https://www.joyofdata.de/blog/parsing-local-csv-file-with-javascript-papa-parse/

const submitEventListenerHolder4decisionTreeForm = new SubmitEventListenerHolder();
const submitEventListenerHolder4knnForm = new SubmitEventListenerHolder();
const submitEventListenerHolder4kdatasetForm = new SubmitEventListenerHolder();

const ClassifierType = Object.freeze({
    DECISION_TREE: 'DECISION_TREE',
    KNN: 'KNN',
    from: function (name) {
        name = name ? name.toUpperCase() : "";
        return [this.DECISION_TREE, this.KNN].includes(name) ? name : this.DECISION_TREE;
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const classifierType = getClassifierTypeFromDocumentsURL();
    setH1(classifierType);
    $('#datasetForm input[type=submit], #kernelWidthAndHeight-inputFields, #section-traindata, #section-decision-tree, #section-KNN, #section-data-input, #section-testdata').fadeOut();
    let dataFile;
    document.querySelector('#csv-file').addEventListener('change', evt => {
        dataFile = evt.target.files[0];
        onCsvFileSelected(dataFile, classifierType);
    });

    submitEventListenerHolder4kdatasetForm.setEventListener(
        document.querySelector('#datasetForm'),
        () => onSubmitDatasetForm(dataFile, classifierType)
    );
});

function onCsvFileSelected(dataFile, classifierType) {
    if (isFileDigitDataset(dataFile.name)) {
        $('#datasetForm input[type=submit], #kernelWidthAndHeight-inputFields').fadeIn();
    } else {
        $('#datasetForm input[type=submit], #kernelWidthAndHeight-inputFields').fadeOut();
        onSubmitDatasetForm(dataFile, classifierType);
    }
}

function onSubmitDatasetForm(dataFile, classifierType) {
    Papa.parse(dataFile, {
        download: true,
        header: false,
        complete: function (results) {
            let datasetDescription = getDatasetDescription(dataFile.name, results.data);
            if (datasetDescription.isDigitDataset()) {
                datasetDescription = transform(
                    datasetDescription,
                    getInputValueById('kernelWidthAndHeight'));
            }

            onDatasetChanged(datasetDescription, classifierType);
        }
    });
}

function getClassifierTypeFromDocumentsURL() {
    const params = (new URL(document.location)).searchParams;
    return ClassifierType.from(params.get('classifier'));
}

function setH1(classifierType) {
    document.querySelector('h1').textContent = getH1(classifierType);
}

function getH1(classifierType) {
    return classifierType == ClassifierType.DECISION_TREE ?
        'Entscheidungsbäume' :
        'k nächste Nachbarn';
}

function isFileDigitDataset(fileName) {
    return fileName.toLowerCase().startsWith('mnist');
}

function getDatasetDescription(fileName, dataset) {
    let attributeNames = dataset[0];
    // remove header (= column names) of dataset
    dataset.splice(0, 1);
    const datasetDescription = {
        fileName: fileName,
        attributeNames: {
            X: attributeNames.slice(0, -1),
            y: attributeNames[attributeNames.length - 1],
            all: attributeNames
        },
        splittedDataset: train_test_split(dataset, 0.8),
        isDigitDataset: function () {
            return isFileDigitDataset(this.fileName);
        }
    };

    if (datasetDescription.isDigitDataset()) {
        datasetDescription.imageWidth = 28;
        datasetDescription.imageHeight = 28;
    }

    return datasetDescription;
}

function transform(datasetDescription, kernelWidthAndHeight) {
    const getScaledImageForRow = row => {
        const strings2Numbers = strings => strings.map(string => Number(string));

        return getScaledImage({
            image: {
                pixels: strings2Numbers(getIndependentValsFromRow(row, datasetDescription)),
                width: datasetDescription.imageWidth,
                height: datasetDescription.imageHeight
            },
            kernelWidthAndHeight: Number(kernelWidthAndHeight)
        });
    };

    const transform = row => getScaledImageForRow(row).pixels.concat(getClassValFromRow(row));
    const someTransformedImage = getScaledImageForRow(datasetDescription.splittedDataset.train[0])

    const transformedDatasetDescription = {
        fileName: datasetDescription.fileName,
        attributeNames: {
            X: createRowColLabels(someTransformedImage.height, someTransformedImage.width),
            y: datasetDescription.attributeNames.y,
            get all() {
                return this.X.concat(this.y);
            }
        },
        splittedDataset: {
            train: datasetDescription.splittedDataset.train.map(transform),
            test: datasetDescription.splittedDataset.test.map(transform)
        },
        isDigitDataset: datasetDescription.isDigitDataset,
        imageWidth: someTransformedImage.width,
        imageHeight: someTransformedImage.height
    };

    console.log('transformed datasetDescription:', transformedDatasetDescription);
    return transformedDatasetDescription;
}

function createRowColLabels(numRows, numCols) {
    const rowColLabels = [];
    for (let row = 1; row <= numRows; row++) {
        for (let col = 1; col <= numCols; col++) {
            rowColLabels.push(`${row}x${col}`);
        }
    }
    return rowColLabels;
}

function getScaledImage({
    image,
    kernelWidthAndHeight
}) {
    const scaledImage_width = image.width / kernelWidthAndHeight;
    const scaledImage_height = image.height / kernelWidthAndHeight;
    const scaledImage = {
        pixels: Array(scaledImage_width * scaledImage_height).fill(0),
        width: scaledImage_width,
        height: scaledImage_height
    };

    for (let y = 0; y + kernelWidthAndHeight <= image.height; y += kernelWidthAndHeight) {
        for (let x = 0; x + kernelWidthAndHeight <= image.width; x += kernelWidthAndHeight) {
            const getPixelWithinKernel =
                (kernelX, kernelY) => getPixel({
                    image: image,
                    point: {
                        x: x + kernelX,
                        y: y + kernelY
                    }
                });
            putPixel({
                image: scaledImage,
                point: {
                    x: x / kernelWidthAndHeight,
                    y: y / kernelWidthAndHeight
                },
                pixel: getAveragePixelValueWithinKernel(kernelWidthAndHeight, getPixelWithinKernel)
            });
        }
    }

    return scaledImage;
}

function getAveragePixelValueWithinKernel(kernelWidthAndHeight, getPixel) {
    let sum = 0;
    for (let y = 0; y < kernelWidthAndHeight; y++) {
        for (let x = 0; x < kernelWidthAndHeight; x++) {
            sum += getPixel(x, y);
        }
    }
    return Math.round(sum / (kernelWidthAndHeight ** 2));;
}

function getPixel({
    image: {
        pixels,
        width
    },
    point: {
        x,
        y
    }
}) {
    return pixels[y * width + x];
}

function putPixel({
    image: {
        pixels,
        width
    },
    point: {
        x,
        y
    },
    pixel
}) {
    pixels[y * width + x] = pixel;
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
    if (datasetDescription.isDigitDataset()) {
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
    } else {
        $('#section-decision-tree').fadeOut();
        $('#section-KNN').fadeIn();
    }
}

function build_classifier_onSubmit(datasetDescription, classifierType) {
    if (classifierType == ClassifierType.DECISION_TREE) {
        submitEventListenerHolder4decisionTreeForm.setEventListener(
            document.querySelector('#decisionTreeForm'),
            e => {
                buildDecisionTreeClassifier({
                    datasetDescription,
                    max_depth: getInputValueById('max_depth'),
                    min_size: getInputValueById('min_size')
                });
            });
    } else {
        submitEventListenerHolder4knnForm.setEventListener(
            document.querySelector('#knnForm'),
            e => {
                const k = getInputValueById('knn-k');
                document.querySelector('#section-KNN h2').textContent = `2. ${k} nächste Nachbarn`;
                buildKnnClassifier(datasetDescription, k, knnWorkers);
            }
        );
    }
}

// FK-TODO: refactor
function buildKnnClassifier(datasetDescription, k, knnWorkers) {
    const X = datasetDescription.splittedDataset.train.map(row => getIndependentValsFromRow(row, datasetDescription));
    const y = datasetDescription.splittedDataset.train.map(getClassValFromRow);
    fitKnnWorkers(knnWorkers, { X, y, k });

    function knnClassifyRows(rows, receivePredictionsForRows) {
        const chunks = splitItemsIntoChunks({
            numItems: rows.length,
            maxNumChunks: knnWorkers.length
        });
        const chunksOfPredictions = [];
        for (let i = 0; i < chunks.length; i++) {
            const knnWorker = knnWorkers[i];
            const { oneBasedStartIndexOfChunk, oneBasedEndIndexInclusiveOfChunk } = chunks[i];
            const zeroBasedStartIndexOfChunk = oneBasedStartIndexOfChunk - 1;
            const zeroBasedEndIndexInclusiveOfChunk = oneBasedEndIndexInclusiveOfChunk - 1;
            const zeroBasedEndIndexExclusiveOfChunk = zeroBasedEndIndexInclusiveOfChunk + 1;

            predictKnnWorker(knnWorker, rows.slice(zeroBasedStartIndexOfChunk, zeroBasedEndIndexExclusiveOfChunk), i, chunksOfPredictions, chunks, receivePredictionsForRows, rows.length);
        }
    }

    onClassifierBuilt(datasetDescription, knnClassifyRows, ClassifierType.KNN);
}

function fitKnnWorkers(knnWorkers, fitParams) {
    for (const knnWorker of knnWorkers) {
        fitKnnWorker(knnWorker, fitParams);
    }
}

function fitKnnWorker(knnWorker, fitParams) {
    knnWorker.postMessage({
        type: 'fit',
        params: fitParams
    });

    knnWorker.onerror = e => console.log(`There is an error with a knnWorker in file ${e.filename}, line ${e.lineno}:`, e.message);
}

// FK-TODO: refactor
function predictKnnWorker(knnWorker, rowsForChunk, i, chunksOfPredictions, chunks, receivePredictionsForRows, mergedResultLength) {
    knnWorker.postMessage({
        type: 'predict',
        params: {
            X: rowsForChunk
        }
    });

    knnWorker.onmessage = event => {
        const predictions = event.data;
        console.log('predictions from knnWorker:', i, predictions);
        chunksOfPredictions.push({ chunk: chunks[i], predictions: predictions });
        if (chunksOfPredictions.length == chunks.length) {
            receivePredictionsForRows(merge(chunksOfPredictions, mergedResultLength));
        }
    };
}

function merge(chunksOfPredictions, mergedResultLength) {
    const allPredictions = Array(mergedResultLength).fill(0);
    for (let i = 0; i < chunksOfPredictions.length; i++) {
        const { chunk, predictions } = chunksOfPredictions[i];
        const { oneBasedStartIndexOfChunk, oneBasedEndIndexInclusiveOfChunk } = chunk;
        const zeroBasedStartIndexOfChunk = oneBasedStartIndexOfChunk - 1;
        const zeroBasedEndIndexInclusiveOfChunk = oneBasedEndIndexInclusiveOfChunk - 1;
        for (let j = zeroBasedStartIndexOfChunk; j <= zeroBasedEndIndexInclusiveOfChunk; j++) {
            allPredictions[j] = predictions[j - zeroBasedStartIndexOfChunk];
        }
    }
    return allPredictions;
}

function buildDecisionTreeClassifier({
    datasetDescription,
    max_depth,
    min_size
}) {
    let gNetwork;
    build_tree_with_worker({
        dataset: datasetDescription.splittedDataset.train,
        max_depth: max_depth,
        min_size: min_size
    }, ({
        type: type,
        value: value
    }) => {
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
            display_accuracy_testingTable_dataInput(classifier, ClassifierType.KNN, datasetDescription, network);
            break;
    }
}

function display_accuracy_testingTable_dataInput(classifier, classifierType, datasetDescription, network) {
    const rowsClassifier = getRowsClassifier(classifierType, classifier);
    displayAccuracy(
        rowsClassifier,
        datasetDescription.splittedDataset.test,
        () => {
            displayTestingTableWithPredictions(rowsClassifier, classifierType, network, classifier, datasetDescription);
            displayDataInput(datasetDescription, getCanvasDataInput(), getTextDataInput(), classifier, network, rowsClassifier, classifierType);
        });
}

function getCanvasDataInput() {
    return document.querySelector('#canvas-data-input');
}

function getTextDataInput() {
    return document.querySelector('#text-data-input');
}

function getRowsClassifier(classifierType, classifier) {
    const cache = new Cache();
    switch (classifierType) {
        case ClassifierType.DECISION_TREE:
            return (rows, receivePredictionsForRows) => {
                const predictions = rows.map(row => cache.get(row, () => predict(classifier, row).value));
                receivePredictionsForRows(predictions);
            };
        case ClassifierType.KNN:
            return (rows, receivePredictionsForRows) => {
                // FK-TODO: refactor
                const unknownRowIndices = [];
                for (let i = 0; i < rows.length; i++) {
                    if (!cache.cache.hasOwnProperty(rows[i])) {
                        unknownRowIndices.push(i);
                    }
                }
                classifier(
                    unknownRowIndices.map(rowIndex => rows[rowIndex]),
                    formerlyUnknownPredictions => {
                        const allPredictions = [];
                        for (let i = 0; i < rows.length; i++) {
                            if (unknownRowIndices.includes(i)) {
                                cache.cache[rows[i]] = formerlyUnknownPredictions[i];
                            }
                            allPredictions[i] = cache.cache[rows[i]];
                        }
                        receivePredictionsForRows(allPredictions);
                    });
                // classifier(rows, receivePredictionsForRows);
            }
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
    display_accuracy_testingTable_dataInput(tree, ClassifierType.DECISION_TREE, datasetDescription, network);
}

function displayDataInput(datasetDescription, canvasDataInput, textDataInput, tree, network, rowsClassifier, classifierType) {
    if (datasetDescription.isDigitDataset()) {
        $(canvasDataInput).show();
        $(textDataInput).hide();
        displayCanvasDataInput(canvasDataInput, tree, network, rowsClassifier, classifierType, datasetDescription.imageWidth, datasetDescription.imageHeight);
    } else {
        $(canvasDataInput).hide();
        $(textDataInput).show();
        displayTextDataInput(textDataInput, datasetDescription.attributeNames.X, tree, network, rowsClassifier, classifierType);
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

function displayAccuracy(rowsClassifier, dataset, k) {
    computeAccuracy(
        rowsClassifier,
        dataset,
        accuracy => {
            console.log(`${Math.floor(accuracy)}%`);
            document.querySelector('#accuracy').innerHTML = `${Math.floor(accuracy)}%`;
            k();
        });
}

function computeAccuracy(rowsClassifier, dataset, receiveAccuracy) {
    rowsClassifier(
        dataset,
        predictions =>
            receiveAccuracy(
                accuracy_percentage(
                    actualClassVals(dataset),
                    predictions))
    );
}

function computeAccuracyOld(rowClassifier, dataset, receiveAccuracy) {
    const progress = document.querySelector('#accuracy-panel progress');
    progress.max = dataset.length;
    const predictions = [];
    for (let i = 0; i < dataset.length; i++) {
        const row = dataset[i];
        rowClassifier(
            row,
            (predictionForRow, index) => {
                console.log(`accuracy progress: ${index + 1}/${dataset.length} = ${predictionForRow}`);
                predictions.push({
                    index: index,
                    prediction: predictionForRow
                });
                if (predictions.length == dataset.length) {
                    predictions.sort((r1, r2) => r1.index - r2.index);
                    const results = predictions.map(result => result.prediction);
                    const accuracy = accuracy_percentage(actualClassVals(dataset), results);
                    receiveAccuracy(accuracy);
                }
            },
            i);
    }
}

function displayTestingTableWithPredictions(rowsClassifier, classifierType, network, tree, datasetDescription) {
    function addPredictionAttribute(attributeNames) {
        const lastAttributeName = attributeNames[attributeNames.length - 1];
        return attributeNames.concat('prediction for ' + lastAttributeName);
    }

    function markRowIfItsPredictionIsWrong(row, data) {
        const isRowsPredictionWrong = data[data.length - 2] != data[data.length - 1];
        const markRow = () => $(row).find("td").addClass('wrongPrediction');

        if (isRowsPredictionWrong) {
            markRow();
        }
    }

    if (datasetDescription.isDigitDataset()) {
        $('#container-digits-test').fadeIn();
        $('#container-testDataSet').fadeOut();
        const onDigitClickedReceiveRow =
            classifierType == ClassifierType.DECISION_TREE ?
                row => predictRowAndHighlightInNetwork(row, tree, network, datasetDescription) :
                row => { };
        rowsClassifier(
            datasetDescription.splittedDataset.test,
            predictions => {
                displayDigitTestDataset({
                    datasetDescription: datasetDescription,
                    predictions: predictions,
                    digitsContainerId: 'container-digits-test',
                    onDigitClickedReceiveRow: onDigitClickedReceiveRow
                });
            });
    } else {
        $('#container-digits-test').fadeOut();
        $('#container-testDataSet').fadeIn();
        const onRowClicked =
            classifierType == ClassifierType.DECISION_TREE ?
                row => predictRowAndHighlightInNetwork(row, tree, network, datasetDescription) :
                row => { };
        rowsClassifier(
            datasetDescription.splittedDataset.test,
            predictions => {
                displayDatasetAsTable({
                    tableContainer: $('#container-testDataSet'),
                    attributeNames: addPredictionAttribute(datasetDescription.attributeNames.all),
                    dataset: addPredictions2Rows(datasetDescription.splittedDataset.test, predictions),
                    createdRow: markRowIfItsPredictionIsWrong,
                    onRowClicked: onRowClicked
                });
            });
    }
}

function addPredictions2Rows(rows, predictions) {
    const addPrediction2Row = (row, prediction) => row.concat(prediction);
    return zip(rows, predictions).map(([row, prediction]) => addPrediction2Row(row, prediction));
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
            timedExecutor.execute(() => onmessage({
                type: 'info',
                value: rootNode
            }));
        },
        onEdgeAdded: (fromNode, toNode) => {
            timedExecutor.execute(() => onmessage({
                type: 'info',
                value: rootNode
            }));
        },
        onStartSplit: nodeId => { },
        onInnerSplit: ({
            workerIndex,
            nodeId,
            startSplitIndex,
            actualSplitIndex,
            endSplitIndex,
            numberOfEntriesInDataset
        }) => {
            onmessage({
                type: 'inner-split',
                value: {
                    workerIndex,
                    startSplitIndex,
                    actualSplitIndex,
                    endSplitIndex,
                    numberOfEntriesInDataset
                }
            });
        },
        onEndSplit: nodeId => { }
    }
}