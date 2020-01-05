'use strict';

function getHtml(url) {
    let capturedHtml;

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