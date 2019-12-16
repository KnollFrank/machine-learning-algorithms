function displayDatasetAsTable(datasetTableContainer, datasetDescription) {
    // <table id="datasetTable" class="display" style="width:100%">
    const table = createTableElement();
    datasetTableContainer.empty();
    datasetTableContainer.append(table);

    let columns =
        datasetDescription.attributeNames.all.map(
            attributeName => ({
                title: attributeName
            }));

    $('#' + table.id).DataTable({
        data: datasetDescription.dataset,
        columns: columns,
    });
}

function createTableElement() {
    const table = document.createElement('table');
    const id = 'datasetTable';
    table.setAttribute('id', id);
    table.classList.add('display');
    table.setAttribute("style", "width:100%;");
    return table;
}