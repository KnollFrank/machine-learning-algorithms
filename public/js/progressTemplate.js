"use strict";

function createProgressElement(workerIndex) {
    let div = getHtml('progressTemplate.html');
    div.querySelector('span').setAttribute('id', 'progress-text-' + workerIndex);
    div.querySelector('progress').setAttribute('id', 'progress-build-decision-tree-' + workerIndex);
    return div;
}