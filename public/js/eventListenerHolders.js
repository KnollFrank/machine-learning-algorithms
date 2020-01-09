'use strict';
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

    constructor(type, htmlElementProvider) {
        this.type = type;
        this.htmlElementProvider = htmlElementProvider;
        this._eventListener = e => {
            return this.eventListener(e);
        }
    }

    setEventListener(eventListener) {
        this.getHtmlElement().removeEventListener(this.type, this._eventListener);
        this.eventListener = eventListener;
        this.getHtmlElement().addEventListener(this.type, this._eventListener);
    }

    getHtmlElement() {
        if (!this.htmlElement) {
            this.htmlElement = this.htmlElementProvider();
        }
        return this.htmlElement;
    }
}