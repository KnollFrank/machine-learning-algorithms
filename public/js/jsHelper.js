'use strict';

Array.prototype.sum = function() {
    return this.reduce((sum, el) => sum + Number(el), 0);
};

function isNumber(n) {
    return !isNaN(n);
}

function zip(array1, array2) {
    return array1.map((value, index) => [value, array2[index]]);
}

function compareFlatArrays(array1, array2) {
    return array1.length === array2.length &&
        array1.every((value, index) => value === array2[index]);
}

// https://stackoverflow.com/questions/1053843/get-the-element-with-the-highest-occurrence-in-an-array
function getElementWithHighestOccurence(array) {
    if (array.length == 0) {
        return null;
    }
    let modeMap = {};
    let maxEl = array[0],
        maxCount = 1;
    for (let i = 0; i < array.length; i++) {
        let el = array[i];
        if (modeMap[el] == null) {
            modeMap[el] = 1;
        } else {
            modeMap[el]++;
        }
        if (modeMap[el] > maxCount) {
            maxEl = el;
            maxCount = modeMap[el];
        }
    }

    return maxEl;
}