function displayTextDataInput(rootElement, attributeNames, tree, network) {
    const dataInputFields = rootElement.querySelector('.dataInputFields');

    dataInputFields.innerHTML = '';
    appendInputElements(dataInputFields, attributeNames);

    rootElement.querySelector('#dataInputForm').addEventListener(
        "submit",
        e => {
            e.preventDefault();
            const prediction = predict(tree, getInputValuesByName(attributeNames));
            highlightPredictionInNetwork(prediction, network);
            rootElement.querySelector('.prediction').innerHTML = prediction.value;
            return false;
        });
}

function displayCanvasDataInput(rootElement, tree, network) {
    const canvas = rootElement.querySelector('#digit-canvas');
    initializeDrawTool(
        canvas,
        rootElement.querySelector("#clear-button"));

    rootElement.querySelector('#predict-digit').addEventListener(
        "click",
        e => {
            e.preventDefault();
            const ctx = canvas.getContext('2d');
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const pixels = imageData2Pixels(imageData);
            const prediction = predict(tree, pixels);
            highlightPredictionInNetwork(prediction, network);
            rootElement.querySelector('.prediction').innerHTML = prediction.value;
            return false;
        });
}

// FK-TODO: beim Zeichnen einen Pencil-Mauszeiger anzeigen
function initializeDrawTool(canvas, clearBtn) {
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

    clearBtn.addEventListener("click", function() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    });
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