import HTMLModule from './HTMLModule';
import {TerminalModule} from './terminal';

export class TermOS extends HTMLModule {
    static get elementName() {
        return 'term-os';
    }

    static get styles() {
        return super.styles + `
            :host {
                height: 100%;
                width: 100%;
                display: flex;
                flex-direction: column;
                user-select: none;
            }
            
            :host ${TerminalModule.elementName} {
                flex: 1;
            }
        `;
    }

    connectedCallback() {
        super.connectedCallback();

        let $terminal = new TerminalModule();
        this.$host.appendChild($terminal);

        $terminal.focus();
    }
}

TermOS.define();
