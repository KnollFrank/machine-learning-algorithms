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
    div.querySelector('span').setAttribute('id', createProgressTextId(workerIndex));
    div.querySelector('progress').setAttribute('id', createProgressId(workerIndex));
    return div;
}

function setProgressText(workerIndex, text) {
    const textElement = document.querySelector('#' + createProgressTextId(workerIndex));
    textElement.textContent = text;
}

function setProgress({ workerIndex, value, max }) {
    const progress = document.querySelector('#' + createProgressId(workerIndex));
    progress.value = value;
    progress.max = max;
}

function createProgressTextId(workerIndex) {
    return 'progress-text-' + workerIndex;
}

function createProgressId(workerIndex) {
    return 'progress-build-decision-tree-' + workerIndex;
}