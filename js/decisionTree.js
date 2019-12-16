'use strict';

// adapted from https://machinelearningmastery.com/implement-decision-tree-algorithm-scratch-python/

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
function accuracy_percentage(actual, predicted) {
    let correct = 0;
    for (let i = 0; i < actual.length; i++) {
        if (actual[i] == predicted[i]) {
            correct += 1;
        }
    }
    return correct / actual.length * 100.0;
}

const actualClassVals = fold => fold.map(getClassValFromRow);

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

    const scores = folds.map((fold, index) => accuracy_percentage(actualClassVals(fold), predictClassVals(fold, index)));
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

// Calculate the Gini index for a split dataset
function gini_index(groups, classes) {
    const getP = group => class_val =>
        group
        .map(getClassValFromRow)
        .filter(classVal => classVal == class_val)
        .length / group.length;

    const getScore = group =>
        classes
        .map(getP(group))
        .map(p => p * p)
        .sum();

    const n_instances =
        groups
        .map(group => group.length)
        .sum();

    const gini =
        groups
        .filter(group => group.length != 0)
        .map(group => (1.0 - getScore(group)) * (group.length / n_instances))
        .sum();

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
    return { type: 'terminalNode', id: newId(), value: mode(outcomes) };
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
    node.type = 'innerNode';
    node.id = newId();
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
    split(root, max_depth, min_size, 1);
    return root;
}

// Print a decision tree
function print_tree(node, attributeNames, depth = 0) {
    if (node.type == 'innerNode') {
        console.log(`${' '.repeat(depth)}[${attributeNames[node.index]} < ${node.value}]`);
        print_tree(node.left, attributeNames, depth + 1);
        print_tree(node.right, attributeNames, depth + 1);
    } else {
        console.log(`${' '.repeat(depth)}[${node.value}]`);
    }
}

// Make a prediction with a decision tree
function predict(node, row) {
    const predictChild = childNode =>
        childNode.type == 'innerNode' ? predict(childNode, row) : { value: childNode.value, nodes: [childNode] };

    const childNode = row[node.index] < node.value ? node.left : node.right;
    let { value, nodes } = predictChild(childNode);
    return { value: value, nodes: [node].concat(nodes) };
}

// Classification and Regression Tree Algorithm
function decision_tree(train, test, max_depth, min_size) {
    const tree = build_tree(train, max_depth, min_size);
    return test.map(row => predict(tree, row).value);
}