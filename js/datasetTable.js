function displayDatasetAsTable(datasetTable, datasetDescription) {
    let columns =
        datasetDescription.attributeNames.all.map(
            attributeName => ({
                title: attributeName
            }));

    datasetTable.DataTable({
        data: datasetDescription.dataset,
        columns: columns
    });
}