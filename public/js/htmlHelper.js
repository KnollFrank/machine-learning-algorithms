'use strict';

function getHtml(url) {
    let capturedHtml;

    // FK-TODO: mit fetch-API umsetzen
    $.ajax({
        url: url,
        dataType: 'html',
        success: function(html) {
            capturedHtml = html;
        },
        async: false
    });

    return $.parseHTML(capturedHtml)[0];
}