'use strict';

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