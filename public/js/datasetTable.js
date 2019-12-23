function displayDatasetAsTable(datasetTableContainer, datasetDescription) {
    const trainDataTable = createTableElement('trainDataTable');
    const testDataTable = createTableElement('testDataTable');
    datasetTableContainer.empty();
    datasetTableContainer.append(trainDataTable);
    datasetTableContainer.append(testDataTable);

    $('#' + trainDataTable.id).DataTable({
        data: datasetDescription.splittedDataset.train,
        columns: getColumns(datasetDescription)
    });

    $('#' + testDataTable.id).DataTable({
        data: datasetDescription.splittedDataset.test,
        columns: getColumns(datasetDescription)
    });
}

// <table id="datasetTable" class="display" style="width:100%">
function createTableElement(id) {
    const table = document.createElement('table');
    table.setAttribute('id', id);
    table.classList.add('display');
    table.setAttribute("style", "width:100%;");
    return table;
}

function getColumns(datasetDescription) {
    return datasetDescription.attributeNames.all.map(
        attributeName => ({
            title: attributeName
        }));
}