import {Command} from './Command';

export class RebootCommand extends Command {
    static get help() {
        return 'Reboot the entire system.';
    }

    get name() {
        return 'reboot';
    }

    run(input, $terminal, $termOS) {
        $terminal.print('rebooting...', false, $terminal.constructor.OUTPUT_TYPES.WARN);

        window.location.reload();
    }
}

RebootCommand.register();
