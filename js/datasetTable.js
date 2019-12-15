function displayDatasetAsTable(datasetDescription) {
    let columns =
        datasetDescription.attributeNames.map(
            attributeName => ({
                title: attributeName
            }));

    $('#datasetTable').DataTable({
        data: datasetDescription.dataset,
        columns: columns
    });
}