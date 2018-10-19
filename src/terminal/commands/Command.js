import {TerminalModule} from '../TerminalModule';

export class Command {
    constructor() {
    }

    static get aliases() {
        return [];
    }

    static get paramsAliases() {
        return {};
    }

    static get help() {
        return '';
    }

    static get man() {
        return '';
    }

    static register(force = false) {
        TerminalModule.registerCommand(new this(), force);
    }

    get name() {
        throw new Error('Getter "name" must be implemented by subclasses.');
    }

    parseInput(input) {
        if (typeof input !== 'string') {
            throw new Error(`String expected. ${typeof input} given.`);
        }

        let params = {};

        input = input.split(' ').filter(input => !!input);

        if (!input.length) {
            return params;
        }

        let i = 0, key, value;
        input.map(param => {
            key = undefined;
            value = undefined;

            if (param.indexOf('--') === 0) {
                param = param.replace('--', '');

                if (param.indexOf('=') === -1) {
                    key = param;
                    value = true;
                } else {
                    key = param.substr(0, param.indexOf('='));
                    value = param.substr(param.indexOf('=') + 1) || true;
                }

            } else if (param.indexOf('-') === 0) {
                param = param.replace('-', '');

                key = param.substr(0, 1);
                value = param.substr(1) || true;

                if (this.constructor.paramsAliases.hasOwnProperty(key)) {
                    key = this.constructor.paramsAliases[key];
                }
            } else if (param) {
                key = i++;
                value = param;
            }

            if (typeof key !== 'undefined' && typeof value !== 'undefined') {
                params[key] = value;
            }
        });

        return params;
    }

    run(input, $terminal, $termOS) {
        throw new Error('Method "run" must be implemented by subclasses.');
    }
}
