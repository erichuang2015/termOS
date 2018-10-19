import {Command} from './Command';

export class ClearCommand extends Command {
    static get help() {
        return 'Clear the terminal screen.';
    }

    get name() {
        return 'clear';
    }

    run(input, $terminal, $termOS) {
        $terminal.clear();
    }
}

ClearCommand.register();
