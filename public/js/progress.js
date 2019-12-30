'use strict';

function createProgressElements(progressId, numWorkers) {
    let progressTable = document.querySelector(`#${progressId} div.table`);
    progressTable.innerHTML = '';
    appendProgressElements(progressTable, numWorkers);
}

function appendProgressElements(parent, numWorkers) {
    for (let workerIndex = 0; workerIndex < numWorkers; workerIndex++) {
        parent.appendChild(createProgressElement(workerIndex));
    }
}

function createProgressElement(workerIndex) {
    let div = getHtml('progressTemplate.html');
    div.setAttribute('id', createTableRowId(workerIndex));
    return div;
}

function setProgress_nodeId(nodeId) {
    document.querySelector('#nodeId').textContent = nodeId;
}

function setProgress_numberOfEntriesInDataset(numberOfEntriesInDataset) {
    document.querySelector('#numberOfEntriesInDataset').textContent = numberOfEntriesInDataset;
}

// FK-TODO: DRY with setProgress_attribute() and setProgress_progress()
function setProgress_workerId(workerIndex, text) {
    const tableRow = document.querySelector('#' + createTableRowId(workerIndex));
    tableRow.querySelector('div.workerId').innerHTML = text;
}

function setProgress_attribute(workerIndex, text) {
    const tableRow = document.querySelector('#' + createTableRowId(workerIndex));
    tableRow.querySelector('div.attribute').innerHTML = text;
}

function setProgress_progress({ workerIndex, value, max }) {
    const tableRow = document.querySelector('#' + createTableRowId(workerIndex));
    const progress = tableRow.querySelector('div.progress progress');
    progress.value = value;
    progress.max = max;
}

function createTableRowId(workerIndex) {
    return 'worker-' + workerIndex;
}