'use strict';

function createProgressElements(progressId, numWorkers) {
    let progressTable = document.querySelector(`#${progressId} div.table`);
    clearTable(progressTable);
    appendRows(progressTable, numWorkers);
}

function clearTable(table) {
    table.querySelectorAll('div.table-row').forEach(row => row.remove());
}

function appendRows(parent, numWorkers) {
    for (let workerIndex = 0; workerIndex < numWorkers; workerIndex++) {
        parent.appendChild(createRow(workerIndex));
    }
}

function createRow(workerIndex) {
    const div = getHtml('progressTemplate.html');
    div.setAttribute('id', createRowId(workerIndex));
    return div;
}

function setProgress_nodeId(nodeId) {
    document.querySelector('#nodeId').textContent = nodeId;
}

function setProgress_numberOfEntriesInDataset(numberOfEntriesInDataset) {
    document.querySelector('#numberOfEntriesInDataset').textContent = numberOfEntriesInDataset;
}

function setProgress_workerId(workerIndex, text) {
    getTableCellOfTableRow(workerIndex, 'div.workerId').innerHTML = text;
}

function setProgress_attribute(workerIndex, text) {
    getTableCellOfTableRow(workerIndex, 'div.attribute').innerHTML = text;
}

function setProgress_progress({ workerIndex, value, max }) {
    const progress = getTableCellOfTableRow(workerIndex, 'div.progress progress');
    progress.value = value;
    progress.max = max;
}

function getTableCellOfTableRow(workerIndex, subElementSelector) {
    return getTableRow(workerIndex).querySelector(subElementSelector);
}

function getTableRow(workerIndex) {
    return document.querySelector('#' + createRowId(workerIndex));
}

function createRowId(workerIndex) {
    return 'worker-' + workerIndex;
}