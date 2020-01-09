'use strict';
// FK-TODO: Datei umbenennen in eventListenerHolders.js
// FK-TODO: SubmitEventListenerHolder extends EventListenerHolder
class SubmitEventListenerHolder {

    constructor() {
        this._eventListener = e => {
            e.preventDefault();
            this.eventListener(e);
            return false;
        }
    }

    setEventListener(form, eventListener) {
        form.removeEventListener('submit', this._eventListener);
        this.eventListener = eventListener;
        form.addEventListener('submit', this._eventListener);
    }
}

class EventListenerHolder {

    constructor(type) {
        this.type = type;
        this._eventListener = e => {
            return this.eventListener(e);
        }
    }

    // FK-TODO: das htmlElement in einen Provider verpackt im Konstruktor übergeben
    setEventListener(htmlElement, eventListener) {
        htmlElement.removeEventListener(this.type, this._eventListener);
        this.eventListener = eventListener;
        htmlElement.addEventListener(this.type, this._eventListener);
    }
}