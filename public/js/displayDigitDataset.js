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
            digit.setFigcaption(...this._getFigcaption(digitDataset[i], i));
            digit.setImage(digitDataset[i]);
            digit.setOnClicked(() => this.onDigitClickedReceiveRow(digitDataset[i]));
            digitsContainer.appendChild(digit.digitElement);
        }
    }

    _getFigcaption(row, i) {
        throw new Error('You have to build your own figcaption');
    }
}

class DisplayDigitTrainDataset extends DisplayDigitDatasetTemplate {

    constructor(imageWidth, imageHeight) {
        super(row => {}, imageWidth, imageHeight);
    }

    _getFigcaption(row) {
        return [getClassValFromRow(row)];
    }
}

function displayDigitTrainDataset(datasetDescription, digitsContainerId, maxDigits2Display) {
    new DisplayDigitTrainDataset(datasetDescription.imageWidth, datasetDescription.imageHeight)
        .displayDigitDataset(
            datasetDescription.splittedDataset.train.slice(0, maxDigits2Display),
            digitsContainerId);
}

class DisplayDigitTestDataset extends DisplayDigitDatasetTemplate {

    constructor(predictions, onDigitClickedReceiveRow, imageWidth, imageHeight) {
        super(onDigitClickedReceiveRow, imageWidth, imageHeight);
        this.predictions = predictions;
    }

    _getFigcaption(row, i) {
        const actualDigit = getClassValFromRow(row);
        const predictedDigit = this.predictions[i];
        return [predictedDigit, actualDigit != predictedDigit ? 'wrongPrediction' : undefined];
    }
}

function displayDigitTestDataset({ datasetDescription, predictions, digitsContainerId, onDigitClickedReceiveRow }) {
    new DisplayDigitTestDataset(predictions, onDigitClickedReceiveRow, datasetDescription.imageWidth, datasetDescription.imageHeight)
        .displayDigitDataset(
            datasetDescription.splittedDataset.test,
            digitsContainerId);
}