'use strict';

let n = 1;
let end_value = 10 ** 4;
search: while (n <= end_value) {
    n++;
    for (var i = 2; i <= Math.sqrt(n); i++)
        if (n % i == 0)
            continue search;
        // found a prime!
    console.log('webworker.js:', n);
    postMessage(n);
}