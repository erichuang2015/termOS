import {Command} from './commands/Command';

import * as termOS from '../../package';
import R from '../R';
import HTMLModule from '../HTMLModule';

export class TerminalModule extends HTMLModule {
    constructor() {
        super();

        this.history = [];
    }

    static get OUTPUT_TYPES() {
        return Object.freeze({
            COMMON: 'COMMON',
            INFO: 'INFO',
            SUCCESS: 'SUCCESS',
            WARN: 'WARN',
            ERROR: 'ERROR'
        });
    }

    static get welcomeMessage() {
        if (!this._welcomeMessage) {
            this._welcomeMessage = () => `terminalOS v${termOS.version}\n\n`;
        }

        return this._welcomeMessage;
    }

    static set welcomeMessage(welcomeMessage) {
        if (typeof welcomeMessage !== 'string' && typeof welcomeMessage !== 'function') {
            throw new Error(`String or function expected. ${typeof welcomeMessage} given.`);
        }

        if (typeof welcomeMessage === 'string') {
            let message = welcomeMessage;

            welcomeMessage = () => message;
        }

        this._welcomeMessage = welcomeMessage;
    }

    static get commands() {
        if (!this.constructor._commands) {
            this.constructor._commands = {};
        }

        return this.constructor._commands;
    }

    static get elementName() {
        return 'term-os-terminal';
    }

    static get styles() {
        return super.styles + `
            :host {
                display: flex;
                background: ${R.color.background};
                color: ${R.color.text};
            }
        
            :host ul {
                flex: 1;
                margin: 24px;
                padding: 0;
                list-style: none;
                white-space: pre-wrap;
                font-family: 'Roboto Mono', monospace;
                user-select: text;
                overflow: hidden scroll;
            }
            
            :host ul:focus {
                outline: none;
            }
            
            :host ul::-webkit-scrollbar {
                display: none;
            }
            
            :host ul li {
                font-size: 1.25em;
            }
            
            :host ul li.INFO {
                color: ${R.color.blue};
            }
            
            :host ul li.SUCCESS {
                color: ${R.color.green};
            }
            
            :host ul li.WARN {
                color: ${R.color.orange};
            }
            
            :host ul li.ERROR {
                color: ${R.color.red};
            }
            
            :host ul li.input {
                outline: none;
                caret-color: transparent;
            }
            
            :host ul li.input::before {
                content: attr(data-prompt);
                margin-right: 2px;
            }
            
            :host ul li.input:last-child:focus::after {
                content: '\\005f';
                margin-left: 2px;
                animation: cursor .8s linear infinite;
            }
            
            :host ul li.input.cursored:last-child:focus {
                caret-color: inherit;
            }
            
            :host ul li.input.cursored:last-child:focus::after {
                display: none;
            }
            
            @keyframes cursor {
                0%, 100% {
                    opacity: 0;
                }
                50% {
                    opacity: 1;
                }
            }
        `;
    }

    static registerCommand(command, force = false) {
        if (!(command instanceof Command)) {
            throw new Error(`${Command.name} expected. ${typeof command} given.`);
        }

        let name = command.name.trim().toLocaleLowerCase();

        if (!force && this.commands.hasOwnProperty(name)) {
            throw new Error(`Command "${name}" already registered.`);
        }

        this.commands[name] = command;

        if (command.constructor.aliases.length) {
            if (!force) {
                command.constructor.aliases.map(alias => {
                    alias = alias.trim().toLowerCase();

                    if (this.commands.hasOwnProperty(alias)) {
                        throw new Error(`Alias "${alias}" for command "${name}" is unacceptable.`);
                    }
                });
            }

            command.constructor.aliases.map(alias => this.commands[alias.trim().toLowerCase()] = command);
        }
    }

    get $io() {
        return this.$host.querySelector('ul');
    }

    get $activeInput() {
        return this.$io.querySelector('.input:last-child');
    }

    get isActive() {
        let isActive = super.isActive;

        if (!isActive) {
            isActive = this.$activeInput === document.activeElement;
        }

        return isActive;
    }

    static createInput(text = null, prompt = '> ', callback = null) {
        let $input = document.createElement('li');
        $input.className = 'input';

        if (typeof prompt !== 'string') {
            throw new Error(`String expected. ${typeof prompt} given.`);
        }

        $input.setAttribute('data-prompt', prompt);

        if (text) {
            if (typeof text !== 'string') {
                throw new Error(`String expected. ${typeof text} given.`);
            }

            $input.innerText = text;
        }

        if (callback) {
            if (typeof callback !== 'function') {
                throw new Error(`Function expected. ${typeof callback} given.`);
            }

            $input.callback = callback;
        }

        return $input;
    }

    static createOutput(text = null, type = this.OUTPUT_TYPES.COMMON) {
        let $output = document.createElement('li');

        if (text) {
            if (typeof text !== 'string') {
                throw new Error(`String expected. ${typeof text} given.`);
            }

            $output.innerText = text;
        }

        if (Object.values(this.OUTPUT_TYPES).indexOf(type) === -1) {
            throw new Error(`Unknown output type "${type}".`);
        }

        $output.className = type;

        return $output;
    }

    newLine(text, prompt) {
        this.$io.appendChild(this.constructor.createInput(text, prompt));

        return this;
    }

    print(text, nl = true, type = this.constructor.OUTPUT_TYPES.COMMON) {
        this.$io.appendChild(this.constructor.createOutput(text, type));

        if (nl) {
            this.newLine();
        }

        return this;
    }

    clear(nl = true) {
        if (this.isActive) {
            this.focus();
        }

        this.$io.innerText = '';

        if (nl) {
            this.newLine();
        }

        return this;
    }

    exec() {
        let input = this.$activeInput.innerText;

        if (typeof this.$activeInput.callback === 'function') {
            return this.$activeInput.callback(input, this, this.$termOS);
        }

        if (!input) {
            this.newLine();

            return false;
        }

        let inputCommand = input.split(' ').shift().trim().toLowerCase();

        this.history.push(input);

        let executed = false;
        Object.keys(this.constructor.commands).map((command) => {
            if (executed) {
                return;
            }

            if (inputCommand === command) {
                try {
                    this.constructor.commands[inputCommand].run(input, this, this.$termOS);
                } catch (error) {
                    console.error(error);

                    throw new Error(`${command} throw an error. See log for more info.`);
                }

                executed = true;
            }
        });

        if (!executed) {
            throw new Error(`Unknown command "${input}".`);
        }

        return executed;
    }

    scrollToBottom() {
        this.$io.scrollTop = this.$io.scrollHeight;

        return this;
    }

    focusToEnd() {
        let range = document.createRange(),
            selection = window.getSelection();

        range.selectNodeContents(this.$activeInput);
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);

        return this;
    }

    suggestCommand(subject) {
        if (typeof subject !== 'string') {
            throw new Error(`String expected. ${typeof subject} given.`);
        }

        subject = subject.trim().toLowerCase();

        return Object.keys(this.constructor.commands).filter(command => command.indexOf(subject) === 0);
    }

    suggest() {
        if (!this.$activeInput) {
            return this;
        }

        let input = this.$activeInput.innerText;

        if (!input) {
            return this;
        }

        let inputSubjects = input.split(' ').filter(input => !!input);
        let subject = inputSubjects.pop();

        let suggests = [];

        Object.assign(suggests, this.suggestCommand(subject));

        if (suggests.length === 1) {
            inputSubjects.push(suggests[0]);
            this.$activeInput.innerText = inputSubjects.join(' ').trim() + ' ';
        } else if (suggests.length > 0) {
            this.print(suggests.join(' '.repeat(4)), false);

            inputSubjects.push(subject);
            this.newLine(inputSubjects.join(' ').trim());
        }

        this.focusToEnd();

        return this;
    }

    historyUp() {
        let historyIndex = parseInt(this.$activeInput.getAttribute('historyindex'));

        if (!this.history[historyIndex - 1]) {
            return;
        }

        this.$activeInput.innerText = this.history[--historyIndex];
        this.$activeInput.setAttribute('historyindex', historyIndex);
        this.focusToEnd();
    }

    historyDown() {
        let historyIndex = parseInt(this.$activeInput.getAttribute('historyindex'));

        if (!this.history[historyIndex + 1]) {
            this.$activeInput.innerText = '';
            this.$activeInput.setAttribute('historyindex', this.history.length.toString());

            return;
        }

        this.$activeInput.innerText = this.history[++historyIndex];
        this.$activeInput.setAttribute('historyindex', historyIndex);
        this.focusToEnd();
    }

    onIOMutation(mutations, observer) {
        let saveFocus = this.isActive;

        for (let mutation of mutations) {
            if (mutation.type === 'childList') {
                this.$io.querySelectorAll('.input').forEach($line => {
                    $line.contentEditable = 'false';
                });

                if (this.$activeInput) {
                    this.$activeInput.setAttribute('historyindex', this.history.length.toString());
                    this.$activeInput.contentEditable = 'true';
                    if (saveFocus) {
                        this.$activeInput.focus();
                    }
                }
            }
        }
    }

    onMouseUp(event) {
        let selection = window.getSelection().toString();

        if (selection) {
            document.execCommand('copy');
        }

        if (!this.$activeInput) {
            this.focus();

            return;
        }

        this.$activeInput.focus();
    }

    onIOKeyDown(event) {
        let isLocked = this.$activeInput && typeof this.$activeInput.callback === 'function';

        switch (event.code) {
            case 'Enter':
                if (event.target === this.$activeInput) {
                    event.preventDefault();
                    try {
                        this.exec();
                    } catch (error) {
                        this.print(error.message, true, this.constructor.OUTPUT_TYPES.ERROR);
                    }

                    return false;
                }
                break;
            case 'Tab':
                if (event.target === this.$activeInput) {
                    event.preventDefault();
                    if (isLocked) {
                        return false;
                    }

                    this.suggest();

                    return false;
                }
                break;
            case 'ArrowLeft':
            case 'ArrowRight':
                if (event.target === this.$activeInput) {
                    this.$activeInput.classList.add('cursored');

                    return true;
                }
                break;
            case 'ArrowUp':
                if (event.target === this.$activeInput) {
                    event.preventDefault();
                    if (isLocked) {
                        return false;
                    }

                    this.historyUp();

                    return false;
                }
                break;
            case 'ArrowDown':
                if (event.target === this.$activeInput) {
                    event.preventDefault();
                    if (isLocked) {
                        return false;
                    }

                    this.historyDown();

                    return false;
                }
                break;
            case 'KeyK':
            case 'KeyL':
                if (event.metaKey || event.ctrlKey) {
                    event.preventDefault();
                    if (isLocked) {
                        return false;
                    }

                    this.clear();

                    return false;
                }
                break;
            case 'KeyC':
                if (event.metaKey || event.ctrlKey) {
                    event.preventDefault();
                    if (isLocked) {
                        return false;
                    }

                    this.newLine();

                    return false;
                }
                break;
        }
    }

    connectedCallback() {
        super.connectedCallback();

        this.tabIndex = -1;

        let $io = document.createElement('ul');
        this.$host.appendChild($io);

        this.addEventListener('mouseup', event => this.onMouseUp(event));

        let mutationObserver = new MutationObserver((mutations, observer) => this.onIOMutation(mutations, observer));
        mutationObserver.observe(this.$io, {childList: true});

        this.$io.addEventListener('keydown', event => this.onIOKeyDown(event));

        if (this.constructor.welcomeMessage) {
            this.print(this.constructor.welcomeMessage(), false, this.constructor.OUTPUT_TYPES.SUCCESS);
        }

        this.newLine();

        return this;
    }
}

TerminalModule.define();
