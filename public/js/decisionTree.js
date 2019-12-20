'use strict';

// adapted from https://machinelearningmastery.com/implement-decision-tree-algorithm-scratch-python/

Array.prototype.sum = function () {
    return this.reduce((sum, el) => sum + el, 0);
};

// Build a decision tree
function build_tree(train, max_depth, min_size) {
    const root = get_split(train);
    split(root, max_depth, min_size, 1);
    return root;
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

// Split a dataset based on an attribute and an attribute value
function test_split(index, value, dataset) {
    const left = [];
    const right = [];
    for (const row of dataset) {
        const splitCondition =
            isNumber(value) ?
                row[index] < value :
                row[index] == value;
        if (splitCondition) {
            left.push(row);
        } else {
            right.push(row);
        }
    }
    return [left, right];
}

function isNumber(n) {
    return !isNaN(n);
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

function isInnerNode(node) {
    return 'left' in node && 'right' in node;
}

function isTerminalNode(node) {
    return !isInnerNode(node);
}

// Create child splits for a node or make terminal
function split(node, max_depth, min_size, depth) {
    node.id = newId();
    let [left, right] = node.groups;
    delete node.groups;
    // check for a no split
    if (left.length == 0 || right.length == 0) {
        node.left = to_terminal(left.concat(right));
        node.right = to_terminal(left.concat(right));
        return;
    }
    // check for max depth
    if (depth >= max_depth) {
        node.left = to_terminal(left);
        node.right = to_terminal(right);
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

// Create a terminal node value
function to_terminal(group) {
    const outcomes = group.map(getClassValFromRow);
    return { id: newId(), value: mode(outcomes) };
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

function getClassValFromRow(row) {
    return row[row.length - 1];
}

// Print a decision tree
function print_tree(node, attributeNames, depth = 0) {
    if (isInnerNode(node)) {
        console.log(`${' '.repeat(depth)}[${node.id}: ${getNodeContent(node, attributeNames)}]`);
        print_tree(node.left, attributeNames, depth + 1);
        print_tree(node.right, attributeNames, depth + 1);
    } else {
        console.log(`${' '.repeat(depth)}[${node.id}: ${node.value}]`);
    }
}

function getNodeContent(node, attributeNames) {
    return `${attributeNames[node.index]} ${isNumber(node.value) ? '<' : '='} ${node.value}`;
}

// Make a prediction with a decision tree
function predict(node, row) {
    if (isTerminalNode(node)) {
        return { value: node.value, nodes: [node] };
    }

    const splitCondition =
        isNumber(node.value) ?
            row[node.index] < node.value :
            row[node.index] == node.value;

    let { value, nodes } = predict(splitCondition ? node.left : node.right, row);
    return { value: value, nodes: [node].concat(nodes) };
}

const actualClassVals = fold => fold.map(getClassValFromRow);

function prune(node) {
    let pruneDescr = { node: node, hasChange: false };
    do {
        pruneDescr = _prune(pruneDescr.node);
    } while (pruneDescr.hasChange == true);

    return pruneDescr.node;
}

function _prune(node) {
    let hasChange = false;

    function prune(node) {
        if (isTerminalNode(node)) {
            return node;
        }

        if (isTerminalNode(node.left) && isTerminalNode(node.right) && node.left.value == node.right.value) {
            hasChange = true;
            return node.left;
        }

        node.left = prune(node.left);
        node.right = prune(node.right);
        return node;
    }

    return { node: prune(node), hasChange: hasChange };
}
