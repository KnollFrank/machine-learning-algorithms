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

    drawImage(pixels) {
        this._drawImageIntoCanvas(pixels, this.digitElement.querySelector('canvas'));
    }

    _drawImageIntoCanvas(pixels, canvas) {
        var ctx = canvas.getContext("2d");
        var imgData = ctx.createImageData(28, 28);

        for (let y = 0; y < 28; y++) {
            for (let x = 0; x < 28; x++) {
                const i = y * 28 + x;
                const pixel = 255 - pixels[i];
                imgData.data[i * 4 + 0] = pixel;
                imgData.data[i * 4 + 1] = pixel;
                imgData.data[i * 4 + 2] = pixel;
                imgData.data[i * 4 + 3] = 255;
            }
        }

        ctx.putImageData(imgData, 0, 0);
    }
}