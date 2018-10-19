import {TerminalModule} from './TerminalModule';

export class TerminalTyper {
    static get STATE_STOP() {
        return -1;
    }

    static get STATE_CLEAR() {
        return 0;
    }

    static get STATE_IDLE() {
        return 1;
    }

    static get STATE_WAITING() {
        return 2;
    }

    static get STATE_TYPING() {
        return 100;
    }

    static get STATE_DELETING() {
        return 200;
    }

    static get TIMEOUT_IDLE() {
        return 100;
    }

    static get TIMEOUT_TYPING() {
        return 100;
    }

    static get TIMEOUT_DELETING() {
        return 50;
    }

    constructor($terminal) {
        if (!($terminal instanceof TerminalModule)) {
            throw new Error(`${TerminalModule.name} expected. ${typeof $terminal} given.`);
        }

        this._$terminal = $terminal;

        let style = document.createElement('style');
        style.innerText = `
            :host main ul li.input.typer::before {
                content: '\\002d\\00a0';
            }
        `;
        this._$terminal.shadowRoot.appendChild(style);

        this._timeout = this.constructor.TIMEOUT_IDLE;
        this._state = this.constructor.STATE_IDLE;

        this._typingText = [];

        this._queue = [];

        this._tick();
    }

    stop() {
        this._state = this.constructor.STATE_STOP;

        return this;
    };

    clear() {
        this._queue = [];
        this._state = this.constructor.STATE_CLEAR;

        return this;
    };

    idle() {
        this._timeout = this.constructor.TIMEOUT_IDLE;
        this._state = this.constructor.STATE_IDLE;

        return this;
    };

    wait(delay) {
        this._queue.push(() => {
            this._timeout = delay;
            this._state = this.constructor.STATE_WAITING;
        });

        return this;
    };

    type(text, repeat = 1) {
        if (typeof text !== 'string') {
            throw new Error(`String expected. ${typeof text} given.`);
        }

        if (typeof repeat !== 'number') {
            throw new Error(`Number expected. ${typeof repeat} given.`);
        }

        do {
            this._queue.push(() => {
                this._timeout = this.constructor.TIMEOUT_TYPING;
                this._state = this.constructor.STATE_TYPING;

                this._typingText = text.toString().split('');
            });
        } while (--repeat > 0);

        return this;
    };

    delete() {
        this._queue.push(() => {
            this._timeout = this.constructor.TIMEOUT_DELETING;
            this._state = this.constructor.STATE_DELETING;
        });

        return this;
    };

    callback(callback) {
        if (typeof callback !== 'function') {
            throw new Error(`Function expected. ${typeof callback} given.`);
        }

        this._queue.push(() => {
            callback();
        });

        return this;
    }

    _next() {
        if (!this._queue.length) {
            this.idle();

            return;
        }

        this._queue.shift()();
    }

    _tick() {
        let $input = this._$terminal.$activeInput;

        switch (this._state) {
            case this.constructor.STATE_STOP:
                this._$terminal.idle();
                return;
            case this.constructor.STATE_CLEAR:
            case this.constructor.STATE_IDLE:
            case this.constructor.STATE_WAITING:
                this._$terminal.idle();
                this._next();
                break;
            case this.constructor.STATE_TYPING:
                this._$terminal.busy();

                if (!$input) {
                    break;
                }

                if (this._typingText.length === 0) {
                    this._next();

                    break;
                }

                $input.classList.add('typer');

                let char = this._typingText.shift();

                switch (char) {
                    case '\b':
                        $input.innerHTML = $input.innerHTML.substr(0, $input.innerHTML.length - 1);
                        break;
                    case '\t':
                        this._$terminal.suggest();
                        break;
                    case '\r':
                        this._$terminal.print(this._typingText.join(''));
                        this._typingText = [];
                        break;
                    case '\n':
                        try {
                            this._$terminal.exec();
                        } catch (error) {
                            this._$terminal.newLine();
                        }
                        break;
                    default:
                        $input.innerHTML = $input.innerHTML + char;
                        break;
                }

                this._timeout = this.constructor.TIMEOUT_TYPING - Math.round(Math.random() * 15);

                break;
            case this.constructor.STATE_DELETING:
                this._$terminal.busy();

                if (!$input) {
                    break;
                }

                if ($input.innerHTML.length === 0) {
                    this._next();

                    break;
                }

                $input.innerHTML = $input.innerHTML.substr(0, $input.innerHTML.length - 1);

                break;
        }

        this._$terminal.scrollToBottom();

        setTimeout(this._tick.bind(this), this._timeout);
    };
}
