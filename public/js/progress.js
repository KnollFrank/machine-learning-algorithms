'use strict';

function createProgressElements(progressId, numWorkers) {
    let progress = document.querySelector('#' + progressId);
    progress.innerHTML = '';
    appendProgressElements(progress, numWorkers);
}

function appendProgressElements(parent, numWorkers) {
    for (let workerIndex = 1; workerIndex <= numWorkers; workerIndex++) {
        parent.appendChild(createProgressElement(workerIndex));
    }
}

function createProgressElement(workerIndex) {
    let div = getHtml('progressTemplate.html');
    div.querySelector('span').setAttribute('id', 'progress-text-' + workerIndex);
    div.querySelector('progress').setAttribute('id', 'progress-build-decision-tree-' + workerIndex);
    return div;
}

function setProgressText(workerIndex, text) {
    const textElement = document.querySelector('#progress-text-' + workerIndex);
    textElement.textContent = text;
}

function setProgress({ workerIndex, value, max }) {
    const progress = document.querySelector('#progress-build-decision-tree-' + workerIndex);
    progress.value = actualSplitIndex - startSplitIndex + 1;
    progress.max = endSplitIndex - startSplitIndex + 1;
}