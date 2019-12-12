'use strict';

Array.prototype.sum = function() {
    return this.reduce((sum, el) => sum + el, 0);
};

function getRndInteger(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Split a dataset into k folds
function cross_validation_split(dataset, n_folds) {
    const dataset_split = [];
    const dataset_copy = [...dataset];
    const fold_size = Math.floor(dataset.length / n_folds);
    for (let i = 0; i < n_folds; i++) {
        const fold = [];
        while (fold.length < fold_size) {
            const index = getRndInteger(0, dataset_copy.length - 1);
            const [removed] = dataset_copy.splice(index, 1);
            fold.push(removed);
        }
        dataset_split.push(fold);
    }
    return dataset_split;
}

// Calculate accuracy percentage
function accuracy_metric(actual, predicted) {
    let correct = 0;
    for (let i = 0; i < actual.length; i++) {
        if (actual[i] == predicted[i]) {
            correct += 1;
        }
    }
    return correct / actual.length * 100.0;
}

// Evaluate an algorithm using a cross validation split
function evaluate_algorithm(dataset, algorithm, n_folds, max_depth, min_size) {
    const folds = cross_validation_split(dataset, n_folds);

    const createTrainSet = index => {
        let train_set = [...folds];
        train_set.splice(index, 1);
        train_set = train_set.flat(1);
        return train_set;
    };

    const createTestSet = fold => {
        const test_set = fold.map(row => [...row]);
        test_set.forEach(row => row[row.length - 1] = undefined);
        return test_set;
    };

    const predictClassVals = (fold, index) =>
        algorithm(
            createTrainSet(index),
            createTestSet(fold),
            max_depth,
            min_size);

    const actualClassVals = fold => fold.map(getClassValFromRow);

    const scores = folds.map((fold, index) => accuracy_metric(actualClassVals(fold), predictClassVals(fold, index)));
    return scores;
}

// Split a dataset based on an attribute and an attribute value
function test_split(index, value, dataset) {
    const left = [];
    const right = [];
    for (const row of dataset) {
        if (row[index] < value) {
            left.push(row);
        } else {
            right.push(row);
        }
    }
    return [left, right];
}

function gini_index(groups, classes) {
    const n_instances = groups.map(group => group.length).sum();
    let gini = 0;
    for (const group of groups) {
        const size = group.length;
        if (size == 0) {
            continue;
        }
        // console.log(group);
        let score = 0;
        for (const class_val in classes) {
            const p = group
                .map(getClassValFromRow)
                .filter(classVal => classVal == class_val)
                .length / size;
            score += p * p;
        }
        gini += (1.0 - score) * (size / n_instances);
    }
    return gini;
}

// Select the best split point for a dataset
function get_split(dataset) {
    const class_values = Array.from(new Set(dataset.map(getClassValFromRow)));
    let [b_index, b_value, b_score, b_groups] = [999, 999, 999, undefined];
    for (let index = 0; index < dataset[0].length - 1; index++) {
        for (const row of dataset) {
            const groups = test_split(index, row[index], dataset);
            const gini = gini_index(groups, class_values);
            // console.log(`X${index+1} < ${row[index]} Gini=${gini}`);
            if (gini < b_score) {
                [b_index, b_value, b_score, b_groups] = [index, row[index], gini, groups];
            }
        }
    }
    return {
        index: b_index,
        value: b_value,
        groups: b_groups
    };
}

// Create a terminal node value
function to_terminal(group) {
    const outcomes = group.map(getClassValFromRow);
    return mode(outcomes)
}

// https://stackoverflow.com/questions/1053843/get-the-element-with-the-highest-occurrence-in-an-array
function mode(array) {
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

// Create child splits for a node or make terminal
function split(node, max_depth, min_size, depth) {
    let [left, right] = node.groups;
    delete node.groups;
    // check for a no split
    if (left.length == 0 || right.length == 0) {
        node.left = node.right = to_terminal(left.concat(right));
        return;
    }
    // check for max depth
    if (depth >= max_depth) {
        [node.left, node.right] = [to_terminal(left), to_terminal(right)];
        return;
    }

    function processChild(child, childName) {
        if (child.length <= min_size) {
            node[childName] = to_terminal(child);
        } else {
            node[childName] = get_split(child);
            split(node[childName], max_depth, min_size, depth + 1);
        }
    }
    processChild(left, 'left');
    processChild(right, 'right');
}

function getClassValFromRow(row) {
    return row[row.length - 1];
}

// Build a decision tree
function build_tree(train, max_depth, min_size) {
    const root = get_split(train);
    split(root, max_depth, min_size, 1)
    print_tree(root)
    return root;
}

// Print a decision tree
function print_tree(node, depth = 0) {
    if (typeof node === 'object') {
        console.log(`${' '.repeat(depth)}[X${node.index + 1} < ${node.value}]`);
        print_tree(node.left, depth + 1);
        print_tree(node.right, depth + 1);
    } else {
        console.log(`${' '.repeat(depth)}[${node}]`);
    }
}

// Make a prediction with a decision tree
function predict(node, row) {
    const predictChild = childNode =>
        typeof childNode === 'object' ? predict(childNode, row) : childNode;

    const childNode = row[node.index] < node.value ? node.left : node.right;
    return predictChild(childNode);
}

// Classification and Regression Tree Algorithm
function decision_tree(train, test, max_depth, min_size) {
    const tree = build_tree(train, max_depth, min_size);
    return test.map(row => predict(tree, row));
}

Papa.parse("concept/data_banknote_authentication.csv", {
    download: true,
    header: false,
    complete: function(results) {
        const dataset = results.data;
        // console.log(dataset);
        dataset.splice(0, 1);
        // console.log(dataset);
        const n_folds = 5;
        const max_depth = 5;
        const min_size = 10;
        const scores = evaluate_algorithm(dataset, decision_tree, n_folds, max_depth, min_size);
        console.log('Scores:', scores);
        console.log('Mean Accuracy:', scores.sum() / scores.length);
    }
});

/*
        let gIndex = gini_index(
            [ // group:
                [
                    [1, 1], // row
                    [1, 0] // row
                ],
                [
                    [1, 1],
                    [1, 0]
                ]
            ], [0, 1]);
        console.log(gIndex);
        gIndex = gini_index(
            [
                [
                    [1, 0],
                    [1, 0]
                ],
                [
                    [1, 1],
                    [1, 1]
                ]
            ], [0, 1]);
        console.log(gIndex);

        const dataset = [
            [2.771244718, 1.784783929, 0],
            [1.728571309, 1.169761413, 0],
            [3.678319846, 2.81281357, 0],
            [3.961043357, 2.61995032, 0],
            [2.999208922, 2.209014212, 0],
            [7.497545867, 3.162953546, 1],
            [9.00220326, 3.339047188, 1],
            [7.444542326, 0.476683375, 1],
            [10.12493903, 3.234550982, 1],
            [6.642287351, 3.319983761, 1]
        ];
        //const split = get_split(dataset)
        //console.log(`Split: [X${split.index + 1} < ${split.value}]`);

        console.log('cross_validation_split:', cross_validation_split(dataset, 5));

        const tree = build_tree(dataset, 3, 1);

        //  predict with a stump
        const stump = {
            'index': 0,
            'right': 1,
            'value': 6.642287351,
            'left': 0
        };

        for (const row of dataset) {
            const prediction = predict(stump, row);
            console.log(`Expected=${getClassValFromRow(row)}, Got=${prediction}`);
        }
*/