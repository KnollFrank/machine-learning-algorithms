'use strict';

class DisplayDigitDatasetTemplate {

    constructor() {}

    displayDigitDataset(digitDataset, digitsContainerId) {
        const digitsContainer = document.querySelector('#' + digitsContainerId);
        for (let i = 0; i < digitDataset.length; i++) {
            const digit = new Digit();
            digit.setFigcaption(...this._getFigcaption(digitDataset[i]));
            digit.setImage(digitDataset[i]);
            digitsContainer.appendChild(digit.digitElement);
        }
    }

    _getFigcaption(row) {
        throw new Error('You have to build your own figcaption');
    }
}

class DisplayDigitTrainDataset extends DisplayDigitDatasetTemplate {

    constructor() {
        super();
    }

    _getFigcaption(row) {
        return [getClassValFromRow(row)];
    }
}

function displayDigitTrainDataset(datasetDescription, digitsContainerId) {
    new DisplayDigitTrainDataset()
        .displayDigitDataset(
            datasetDescription.splittedDataset.train,
            digitsContainerId);
}

class DisplayDigitTestDataset extends DisplayDigitDatasetTemplate {

    constructor(tree) {
        super();
        this.tree = tree;
    }

    _getFigcaption(row) {
        const actualDigit = getClassValFromRow(row);
        const predictedDigit = predict(this.tree, row).value;
        return [`actual: ${actualDigit}, predicted: ${predictedDigit}`, actualDigit != predictedDigit ? 'wrongPrediction' : undefined];
    }
}

function displayDigitTestDataset(datasetDescription, tree, digitsContainerId) {
    new DisplayDigitTestDataset(tree)
        .displayDigitDataset(
            datasetDescription.splittedDataset.test,
            digitsContainerId);
}