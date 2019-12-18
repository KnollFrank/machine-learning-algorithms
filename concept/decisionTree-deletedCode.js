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

// Classification and Regression Tree Algorithm
function decision_tree(train, test, max_depth, min_size) {
    const tree = build_tree(train, max_depth, min_size);
    return test.map(row => predict(tree, row).value);
}