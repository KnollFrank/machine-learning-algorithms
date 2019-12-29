'use strict';

class Digit {
    constructor() {
        this.digitElement = getHtml('digitTemplate.html');
        this.digitElement.setAttribute('id', 'digit-' + newId());
    }

    setFigcaption(innerHTML, clazz) {
        const figcaption = this.digitElement.querySelector('figcaption');
        figcaption.innerHTML = innerHTML;
        if (clazz) {
            figcaption.classList.add(clazz);
        }
    }

    setImage(pixels) {
        this._drawImageIntoCanvas(pixels, this.digitElement.querySelector('canvas'));
    }

    _drawImageIntoCanvas(pixels, canvas) {
        var ctx = canvas.getContext("2d");
        var imageData = ctx.createImageData(28, 28);

        // TODO: DRY with imageData2Pixels()
        for (let y = 0; y < imageData.height; y++) {
            for (let x = 0; x < imageData.width; x++) {
                const i = y * imageData.width + x;
                imageData.data[i * 4 + 0] = 0;
                imageData.data[i * 4 + 1] = 0;
                imageData.data[i * 4 + 2] = 0;
                imageData.data[i * 4 + 3] = pixels[i];
            }
        }

        ctx.putImageData(imageData, 0, 0);
    }
}

function imageData2Pixels(imageData) {
    const pixels = [];
    for (let y = 0; y < imageData.height; y++) {
        for (let x = 0; x < imageData.width; x++) {
            const i = y * imageData.width + x;
            const alpha = imageData.data[i * 4 + 3];
            pixels.push(alpha);
        }
    }
    return pixels;
}