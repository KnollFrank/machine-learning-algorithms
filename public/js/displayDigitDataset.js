'use strict';

class DisplayDigitDatasetTemplate {

    constructor(onDigitClickedReceiveRow, imageWidth, imageHeight) {
        this.onDigitClickedReceiveRow = onDigitClickedReceiveRow;
        this.imageWidth = imageWidth;
        this.imageHeight = imageHeight;
    }

    displayDigitDataset(digitDataset, digitsContainerId) {
        const digitsContainer = document.querySelector('#' + digitsContainerId);
        digitsContainer.innerHTML = '';
        for (let i = 0; i < digitDataset.length; i++) {
            const digit = new Digit(this.imageWidth, this.imageHeight);
            digit.setFigcaption(...this._getFigcaption(digitDataset[i]));
            digit.setImage(digitDataset[i]);
            digit.setOnClicked(() => this.onDigitClickedReceiveRow(digitDataset[i]));
            digitsContainer.appendChild(digit.digitElement);
        }
    }

    _getFigcaption(row) {
        throw new Error('You have to build your own figcaption');
    }
}

class DisplayDigitTrainDataset extends DisplayDigitDatasetTemplate {

    constructor(imageWidth, imageHeight) {
        super(row => { }, imageWidth, imageHeight);
    }

    _getFigcaption(row) {
        return [getClassValFromRow(row)];
    }
}

function displayDigitTrainDataset(datasetDescription, digitsContainerId) {
    new DisplayDigitTrainDataset(datasetDescription.imageWidth, datasetDescription.imageHeight)
        .displayDigitDataset(
            datasetDescription.splittedDataset.train,
            digitsContainerId);
}

class DisplayDigitTestDataset extends DisplayDigitDatasetTemplate {

    constructor(rowClassifier, onDigitClickedReceiveRow, imageWidth, imageHeight) {
        super(onDigitClickedReceiveRow, imageWidth, imageHeight);
        this.rowClassifier = rowClassifier;
    }

    _getFigcaption(row) {
        const actualDigit = getClassValFromRow(row);
        const predictedDigit = this.rowClassifier(row);
        return [predictedDigit, actualDigit != predictedDigit ? 'wrongPrediction' : undefined];
    }
}

function displayDigitTestDataset({ datasetDescription, rowClassifier, digitsContainerId, onDigitClickedReceiveRow }) {
    new DisplayDigitTestDataset(rowClassifier, onDigitClickedReceiveRow, datasetDescription.imageWidth, datasetDescription.imageHeight)
        .displayDigitDataset(
            datasetDescription.splittedDataset.test,
            digitsContainerId);
}