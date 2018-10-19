import {Command} from './Command';

export class CommandsCommand extends Command {
    static get help() {
        return 'Display list of registered commands.';
    }

    get name() {
        return 'commands';
    }

    run(input, $terminal, $termOS) {
        let commands = Object.keys($terminal.constructor.commands);

        $terminal.print(commands.sort().join(', '), true, $terminal.constructor.OUTPUT_TYPES.INFO);
    }
}

CommandsCommand.register();
