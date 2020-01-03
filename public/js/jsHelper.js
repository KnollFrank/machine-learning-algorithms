'use strict';

Array.prototype.sum = function () {
    return this.reduce((sum, el) => sum + Number(el), 0);
};

function isNumber(n) {
    return !isNaN(n);
}

function zip(array1, array2) {
    return array1.map((value, index) => [value, array2[index]]);
}
