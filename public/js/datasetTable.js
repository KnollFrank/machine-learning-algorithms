function displayDatasetAsTable(datasetTableContainer, datasetDescription) {
    const table = createTableElement();
    datasetTableContainer.empty();
    datasetTableContainer.append(table);

    $('#' + table.id).DataTable({
        data: datasetDescription.splittedDataset.train,
        columns: getColumns(datasetDescription)
    });
}

// <table id="datasetTable" class="display" style="width:100%">
function createTableElement() {
    const table = document.createElement('table');
    const id = 'datasetTable';
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