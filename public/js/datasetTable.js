function displayDatasetAsTable(tableContainer, attributeNames, dataset) {
    const table = createTableElement();
    tableContainer.empty();
    tableContainer.append(table);

    $('#' + table.id).DataTable({
        data: dataset,
        columns: getColumns(attributeNames)
    });
}

// <table id="datasetTable" class="display" style="width:100%">
function createTableElement() {
    const table = document.createElement('table');
    table.setAttribute('id', '_' + newId());
    table.classList.add('display');
    table.setAttribute("style", "width:100%;");
    return table;
}

function getColumns(attributeNames) {
    return attributeNames.map(
        attributeName => ({
            title: attributeName
        }));
}