function displayTextDataInput(rootElement, attributeNames, tree, network, rowClassifier, classifierType) {
    const dataInputFields = rootElement.querySelector('.dataInputFields');

    dataInputFields.innerHTML = '';
    appendInputElements(dataInputFields, attributeNames);

    rootElement.querySelector('#dataInputForm').addEventListener(
        "submit",
        e => {
            e.preventDefault();
            if (classifierType == ClassifierType.DECISION_TREE) {
                const prediction = predict(tree, getInputValuesByName(attributeNames));
                highlightPredictionInNetwork(prediction, network);
                // FK-TODO: DRY with setPrediction()
                rootElement.querySelector('.prediction').innerHTML = prediction.value;
            } else {
                const prediction = rowClassifier(getInputValuesByName(attributeNames));
                // FK-TODO: DRY with setPrediction()
                rootElement.querySelector('.prediction').innerHTML = prediction;
            }
            return false;
        });
}

function displayCanvasDataInput(rootElement, tree, network, rowClassifier, classifierType, imageWidth, imageHeight) {
    if (classifierType == ClassifierType.DECISION_TREE) {
        rootElement.classList.add('decision-tree');
        rootElement.classList.remove('knn');
    } else {
        rootElement.classList.add('knn');
        rootElement.classList.remove('decision-tree');
    }
    const canvasBig = rootElement.querySelector('#digit-canvas-big');
    const canvasSmall = document.querySelector('#digit-canvas-small');
    canvasSmall.width = imageWidth;
    canvasSmall.height = imageHeight;

    initializeDrawTool(
        canvasBig,
        canvasSmall,
        rootElement.querySelector("#new-prediction"),
        (canvasBig, canvasSmall) => predictDrawnDigit(canvasBig, canvasSmall, tree, network, rowClassifier, classifierType));
}

function initializeDrawTool(canvasBig, canvasSmall, newPredictionBtn, onDigitDrawn) {
    const ctxBig = canvasBig.getContext('2d');
    ctxBig.globalAlpha = 1;
    ctxBig.globalCompositeOperation = 'source-over';
    ctxBig.strokeStyle = 'black';
    ctxBig.lineWidth = 20;
    ctxBig.lineJoin = ctxBig.lineCap = 'round';
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

    $(canvasBig).on('mousedown', function(e) {
        last_mouse = mouse = getMousePos(canvasBig, e);
        mousedown = true;
        fitSrc2Dst({ srcCanvas: canvasBig, dstCanvas: canvasSmall });
    });

    $(canvasBig).on('mouseup', function(e) {
        mousedown = false;
        onDigitDrawn(canvasBig, canvasSmall);
    });

    $(canvasBig).on('mousemove', function(e) {
        mouse = getMousePos(canvasBig, e);
        if (mousedown) {
            ctxBig.beginPath();
            ctxBig.moveTo(last_mouse.x, last_mouse.y);
            ctxBig.lineTo(mouse.x, mouse.y);
            ctxBig.stroke();
        }
        last_mouse = mouse;
        fitSrc2Dst({ srcCanvas: canvasBig, dstCanvas: canvasSmall });
    });

    newPredictionBtn.addEventListener("click", () => prepareNewPrediction(canvasBig, canvasSmall));
    prepareNewPrediction(canvasBig, canvasSmall);
}

function prepareNewPrediction(canvasBig, canvasSmall) {
    clearCanvas(canvasBig, canvasSmall);
    setPrediction('');
}

function clearCanvas(canvasBig, canvasSmall) {
    canvasBig.getContext('2d').clearRect(0, 0, canvasBig.width, canvasBig.height);
    canvasSmall.getContext('2d').clearRect(0, 0, canvasSmall.width, canvasSmall.height);
}

function predictDrawnDigit(canvasBig, canvasSmall, tree, network, rowClassifier, classifierType) {
    const pixels = getPixels(canvasBig, canvasSmall);
    if (classifierType == ClassifierType.DECISION_TREE) {
        const prediction = predict(tree, pixels);
        highlightPredictionInNetwork(prediction, network);
        setPrediction(prediction.value);
    } else {
        setPrediction(rowClassifier(pixels));
    }
}

function setPrediction(predictedValue) {
    document.querySelector('#prediction-container .prediction').innerHTML = predictedValue;
}

function getPixels(canvasBig, canvasSmall) {
    fitSrc2Dst({ srcCanvas: canvasBig, dstCanvas: canvasSmall });
    const ctxSmall = canvasSmall.getContext('2d');
    const imageData = ctxSmall.getImageData(0, 0, canvasSmall.width, canvasSmall.height);
    return imageData2Pixels(imageData);
}

function fitSrc2Dst({ srcCanvas, dstCanvas }) {
    var srcCtx = srcCanvas.getContext('2d');
    var imageData = srcCtx.getImageData(0, 0, srcCanvas.width, srcCanvas.height);
    var destCtx = dstCanvas.getContext('2d');

    var newCanvas = $("<canvas>")
        .attr("width", imageData.width)
        .attr("height", imageData.height)[0];

    newCanvas.getContext('2d').putImageData(imageData, 0, 0);

    destCtx.save();
    destCtx.scale(dstCanvas.width / srcCanvas.width, dstCanvas.height / srcCanvas.height);
    destCtx.drawImage(newCanvas, 0, 0);
    destCtx.restore();
}

function highlightPredictionInNetwork(prediction, network) {
    const nodeIdsOfPrediction = prediction.nodes.map(node => node.id);
    highlightTreeNodes(network.nodes, nodeIdsOfPrediction);
    highlightTreeEdges(network.edges, nodeIdsOfPrediction);
}

function highlightTreeNodes(networkNodes, nodeIds2Highlight) {
    const networkNodes2Highlight = networkNodes.get({ filter: networkNode => nodeIds2Highlight.includes(networkNode.id) });
    highlightNodes(networkNodes, networkNodes2Highlight);
}

function highlightTreeEdges(networkEdges, nodeIds2Highlight) {
    const networkEdges2Highlight = [];
    for (const [fromId, toId] of getConsecutiveNodes(nodeIds2Highlight)) {
        networkEdges2Highlight.push(getNetworkEdge(networkEdges, fromId, toId));
    }

    highlightEdges(networkEdges, networkEdges2Highlight);
}

function* getConsecutiveNodes(nodes) {
    for (let i = 0; i < nodes.length - 1; i++) {
        yield [nodes[i], nodes[i + 1]];
    }
}

function getNetworkEdge(networkEdges, fromId, toId) {
    return networkEdges.get({
        filter: networkEdge => networkEdge.from == fromId && networkEdge.to == toId
    })[0];
}

function appendInputElements(parent, attributeNames) {
    attributeNames
        .map(createInputElement)
        .forEach(inputElement => parent.appendChild(inputElement));
}

function getInputValuesByName(attributeNames) {
    return attributeNames.map(getInputValueByName);
}