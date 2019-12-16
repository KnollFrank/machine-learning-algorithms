function displayDatasetAsTable(datasetTableContainer, datasetDescription) {
    // <table id="datasetTable" class="display" style="width:100%">
    const id = 'datasetTable';
    const table = createTableElement(id);

    datasetTableContainer.empty();
    datasetTableContainer.append(table);

    let columns =
        datasetDescription.attributeNames.all.map(
            attributeName => ({
                title: attributeName
            }));

    $('#' + id).DataTable({
        data: datasetDescription.dataset,
        columns: columns,
    });
}

function createTableElement(id) {
    const table = document.createElement('table');
    table.setAttribute('id', id);
    table.classList.add('display');
    table.setAttribute("style", "width:100%;");
    return table;
}