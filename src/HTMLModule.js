import {TermOS} from './TermOS';

export default class HTMLModule extends HTMLElement {
    constructor() {
        super();

        if (this.constructor.isShadowed) {
            this.attachShadow({mode: 'open'});
        }
    }

    static get elementName() {
        throw new Error('Getter "elementName" must be implemented by subclasses.');
    }

    static get isShadowed() {
        return true;
    }

    static get styles() {
        return '';
    }

    static define(name = this.elementName) {
        if (typeof name !== 'string') {
            throw new Error(`String expected. ${typeof name} given.`);
        }

        customElements.define(name, this);
    }

    get $host() {
        return this.constructor.isShadowed ? this.shadowRoot : this;
    }

    get $termOS() {
        let $termOS = this;

        do {
            if ($termOS instanceof TermOS) {
                return $termOS;
            }

            if ($termOS instanceof HTMLBodyElement) {
                return null;
            }

            $termOS = ($termOS instanceof ShadowRoot) ? $termOS.host : $termOS.parentNode;
        } while (true);
    }

    get isActive() {
        let activeElement = document.activeElement;

        if (activeElement === this) {
            return true;
        }

        while (activeElement && activeElement.shadowRoot) {
            activeElement = activeElement.shadowRoot.activeElement;

            if (activeElement === this) {
                return true;
            }
        }

        return false;
    }

    prependStyles(styles) {
        if (typeof styles !== 'string') {
            throw new Error(`String expected. ${typeof styles} given.`);
        }

        if (!this.constructor.isShadowed) {
            styles = styles.replace(/:host/g, this.constructor.elementName);
        }

        if (!this.firstChild) {
            return this.appendStyles(styles);
        }

        let $style = document.createElement('style');
        $style.textContent = styles;
        this.insertBefore($style, this.firstChild);
    }

    appendStyles(styles) {
        if (typeof styles !== 'string') {
            throw new Error(`String expected. ${typeof styles} given.`);
        }

        if (!this.constructor.isShadowed) {
            styles = styles.replace(/:host/g, this.constructor.elementName);
        }

        let $style = document.createElement('style');
        $style.textContent = styles;
        this.$host.appendChild($style);
    }

    dispatchCustomEvent(name, detail = null, params = {}) {
        if (typeof name !== 'string') {
            throw new Error(`String expected. ${typeof name} given.`);
        }

        if (typeof params !== 'object') {
            throw new Error(`Object expected. ${typeof params} given.`);
        }

        params.detail = detail;

        let event = new CustomEvent(name, params);

        this.dispatchEvent(event);
    }

    show() {
        this.style.display = null;

        return this;
    }

    hide() {
        this.style.display = 'none';

        return this;
    }

    onFocus(event) {
    }

    onFocusOut(event) {
    }

    afterConnectedCallback() {
        return this;
    }

    connectedCallback() {
        this.appendStyles(this.constructor.styles);

        if (!this.$termOS) {
            this.remove();

            throw new Error(`${this.constructor.elementName} must be a child of ${TermOS.elementName}.`);
        }

        this.addEventListener('focus', event => this.onFocus(event));
        this.addEventListener('focusout', event => this.onFocusOut(event));

        setTimeout(() => this.afterConnectedCallback(), 1);

        return this;
    }

    disconnectedCallback() {
        return this;
    }
}
