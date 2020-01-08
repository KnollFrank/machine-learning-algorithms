'use strict';

function getCenterOfMass(image) {
    let totalMass = 0;
    let centerOfMass = { x: 0, y: 0 };
    const origin = { x: -1, y: -1 };

    for (let y = 0; y < image.height; y++) {
        for (let x = 0; x < image.width; x++) {
            const mass = getMassOfPointWithinImage(image, { x, y });
            totalMass += mass;
            centerOfMass = addPoints(centerOfMass, mulPoint(mass, subPoints({ x, y }, origin)));
        }
    }
    centerOfMass = mulPoint(1 / totalMass, centerOfMass);

    return subPoints(centerOfMass, subPoints({ x: 0, y: 0 }, origin)); // == addPoints(centerOfMass, origin);
}

function getMassOfPointWithinImage(image, point) {
    return image.pixels[getArrayIndexOfPoint(point, image.width)];
}

// FK-TODO: erzeuge eine Point-Klasse mit Methoden für *, -, +
function addPoints(point1, point2) {
    return { x: point1.x + point2.x, y: point1.y + point2.y };
}

function mulPoint(scalar, { x, y }) {
    return { x: scalar * x, y: scalar * y };
}

function subPoints(point1, point2) {
    return { x: point1.x - point2.x, y: point1.y - point2.y };
}
