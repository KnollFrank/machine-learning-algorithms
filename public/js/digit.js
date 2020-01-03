'use strict';

class Digit {
    constructor(imageWidth, imageHeight) {
        this.imageWidth = imageWidth;
        this.imageHeight = imageHeight;
        this.digitElement = getHtml('digitTemplate.html');
        this.digitElement.setAttribute('id', 'digit-' + newId());
        this.digitElement.querySelector('canvas').width = imageWidth;
        this.digitElement.querySelector('canvas').height = imageHeight;
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
        const ctx = canvas.getContext("2d");
        const imageData = ctx.createImageData(this.imageWidth, this.imageHeight);

        for (const it of iterateOverImageData(imageData)) {
            imageData.data[it.color_index.red] = 0;
            imageData.data[it.color_index.green] = 0;
            imageData.data[it.color_index.blue] = 0;
            imageData.data[it.color_index.alpha] = pixels[it.pixelIndex];
        }

        ctx.putImageData(imageData, 0, 0);
    }

    setOnClicked(onClicked) {
        this.digitElement.addEventListener('click', onClicked);
    }
}

function imageData2Pixels(imageData) {
    const pixels = [];
    for (const it of iterateOverImageData(imageData)) {
        pixels.push(imageData.data[it.color_index.alpha]);
    }
    return pixels;
}

function* iterateOverImageData(imageData) {
    for (let y = 0; y < imageData.height; y++) {
        for (let x = 0; x < imageData.width; x++) {
            const i = y * imageData.width + x;
            yield {
                x: x,
                y: y,
                pixelIndex: i,
                color_index: {
                    red: i * 4 + 0,
                    green: i * 4 + 1,
                    blue: i * 4 + 2,
                    alpha: i * 4 + 3
                }
            };
        }
    }
}