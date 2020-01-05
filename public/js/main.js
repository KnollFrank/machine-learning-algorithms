'use strict';

// FK-TODO: verwende import export
// see https://www.joyofdata.de/blog/parsing-local-csv-file-with-javascript-papa-parse/

const ClassifierType = Object.freeze({
    DECISION_TREE: 'DECISION_TREE',
    KNN: 'KNN',
    from: function(name) {
        name = name ? name.toUpperCase() : "";
        return [this.DECISION_TREE, this.KNN].includes(name) ? name : this.DECISION_TREE;
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const classifierType = getClassifierTypeFromDocumentsURL();
    setH1(classifierType);
    $('#section-traindata, #section-decision-tree, #section-KNN, #section-data-input, #section-testdata').fadeOut();
    document.querySelector('#csv-file').addEventListener('change', evt => {
        // const dataFile = 'data/data_banknote_authentication.csv';
        // const dataFile = 'data/processed.cleveland.csv';
        const dataFile = evt.target.files[0];

        Papa.parse(dataFile, {
            download: true,
            header: false,
            complete: function(results) {
                onDatasetChanged(
                    transformIfIsDigitDataset(getDatasetDescription(dataFile.name, results.data)),
                    classifierType);
            }
        });
    });
});

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
        isDigitDataset: function() {
            return this.fileName.toLowerCase().startsWith('mnist');
        }
    };

    if (datasetDescription.isDigitDataset()) {
        datasetDescription.imageWidth = 28;
        datasetDescription.imageHeight = 28;
    }

    return datasetDescription;
}

function transformIfIsDigitDataset(datasetDescription) {
    if (!datasetDescription.isDigitDataset()) {
        return datasetDescription;
    }

    // FK-TODO: kernelWidthAndHeight und k über UI einstellbar machen
    const kernelWidthAndHeight = 1;

    const getScaledImageForRow = row => {
        const strings2Numbers = strings => strings.map(string => Number(string));

        return getScaledImage({
            image: {
                pixels: strings2Numbers(getIndependentValsFromRow(row, datasetDescription)),
                width: datasetDescription.imageWidth,
                height: datasetDescription.imageHeight
            },
            kernelWidthAndHeight: kernelWidthAndHeight
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

class SubmitEventListenerHolder {

    setEventListener(form, eventListener) {
        if (this.eventListener) {
            form.removeEventListener('submit', this.eventListener);
        }
        this.eventListener = eventListener;
        form.addEventListener('submit', eventListener);
    }
}

const submitEventListenerHolder4decisionTreeForm = new SubmitEventListenerHolder();
const submitEventListenerHolder4knnForm = new SubmitEventListenerHolder();

function build_classifier_onSubmit(datasetDescription, classifierType) {
    if (classifierType == ClassifierType.DECISION_TREE) {
        submitEventListenerHolder4decisionTreeForm.setEventListener(
            document.querySelector('#decisionTreeForm'),
            e => {
                // FK-TODO: DRY with KK-case:
                //          - e.preventDefault();
                //          - return false;
                e.preventDefault();
                buildDecisionTreeClassifier({
                    datasetDescription,
                    max_depth: getInputValueById('max_depth'),
                    min_size: getInputValueById('min_size')
                });
                return false;
            });
    } else {
        submitEventListenerHolder4knnForm.setEventListener(
            document.querySelector('#knnForm'),
            e => {
                e.preventDefault();
                const k = getInputValueById('knn-k');
                document.querySelector('#section-KNN h2').textContent = `2. ${k} nächste Nachbarn`;
                buildKNNClassifier(datasetDescription, k);
                return false;
            }
        );
    }
}

function buildKNNClassifier(datasetDescription, k) {
    const knn = new KNNUsingKDTree(k);
    knn.fit(
        datasetDescription.splittedDataset.train.map(row => getIndependentValsFromRow(row, datasetDescription)),
        datasetDescription.splittedDataset.train.map(getClassValFromRow));
    onClassifierBuilt(datasetDescription, knn, ClassifierType.KNN);
}

function buildDecisionTreeClassifier({ datasetDescription, max_depth, min_size }) {
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

function build_tree_with_worker({
    dataset,
    max_depth,
    min_size
}, onmessage) {
    $('#progress, #subsection-decision-tree').fadeIn();
    createProgressElements('progress', splitterWorkers.length);
    new DecisionTreeBuilder(
            max_depth,
            min_size,
            splitterWorkers,
            createTreeListener(onmessage))
        .build_tree(
            dataset,
            tree => onmessage({
                type: 'result',
                value: tree
            }));
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
    if (datasetDescription.isDigitDataset()) {
        canvasDataInput.style.display = "block";
        textDataInput.style.display = "none";
        displayCanvasDataInput(canvasDataInput, tree, network, rowClassifier, classifierType, datasetDescription.imageWidth, datasetDescription.imageHeight);
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
    console.log(`${Math.floor(accuracy)}%`);
    document.querySelector('#accuracy').innerHTML = `${Math.floor(accuracy)}%`;
}

// FK-TODO: computeAccuracy in einem Worker durchführen, um den Hauptprozess nicht zu verlangsamen.
function computeAccuracy(rowClassifier, dataset) {
    const progress = document.querySelector('#accuracy-panel progress');
    progress.max = dataset.length;
    return accuracy_percentage(
        actualClassVals(dataset),
        dataset.map(
            (row, index) => {
                progress.value = index + 1;
                console.log(`accuracy progress: ${index + 1}/${dataset.length}`);
                // FK-TODO: das Ergebnis von "rowClassifier(row)" Zwischenspeichern für
                //          die Dartsellung der Testdaten.
                return rowClassifier(row);
            }));
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

    if (datasetDescription.isDigitDataset()) {
        $('#container-digits-test').fadeIn();
        $('#container-testDataSet').fadeOut();
        const onDigitClickedReceiveRow =
            classifierType == ClassifierType.DECISION_TREE ?
            row => predictRowAndHighlightInNetwork(row, tree, network, datasetDescription) :
            row => {};
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
            row => {};
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
        onStartSplit: nodeId => {},
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
        onEndSplit: nodeId => {}
    }
}