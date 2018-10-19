import {Command} from './Command';

export class HelpCommand extends Command {
    static get help() {
        return 'Display helpful information about terminal commands. Type "help %command%" for more info.';
    }

    get name() {
        return 'help';
    }

    run(input, $terminal, $termOS) {
        let params = this.parseInput(input.split(' ').slice(1).join(' '));

        if (!params[0] || typeof params[0] !== 'string') {
            $terminal.print('Type "help %command%" for more info.', true, $terminal.constructor.OUTPUT_TYPES.INFO);

            return;
        }

        if (!$terminal.constructor.commands.hasOwnProperty(params[0])) {
            $terminal.print(`Unknown command "${params[0]}".`, true, $terminal.constructor.OUTPUT_TYPES.ERROR);

            return;
        }

        let command = $terminal.constructor.commands[params[0]];

        if (!command.constructor.help) {
            $terminal.print(`Help for command "${command.name}" is not provided.`, true, $terminal.constructor.OUTPUT_TYPES.WARN);

            return;
        }

        $terminal.print(command.constructor.help, true, $terminal.constructor.OUTPUT_TYPES.INFO);
    }
}

HelpCommand.register();
