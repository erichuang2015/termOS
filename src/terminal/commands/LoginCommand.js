import {Command} from './Command';

export class LoginCommand extends Command {
    get name() {
        return 'login';
    }

    showLoginInput($terminal) {
        let $login = $terminal.constructor.createInput(null, 'login: ', (input, $terminal, $termOS) => this.onLoginProvided(input, $terminal, $termOS));

        $terminal.clear(false).$io.appendChild($login);
    }

    showPasswordInput($terminal) {
        let $password = $terminal.constructor.createInput(null, 'password: ', (input, $terminal, $termOS) => {
            this.onPasswordProvided($password.getAttribute('value'), $terminal, $termOS);
        });
        $password.setAttribute('value', '');

        $password.addEventListener('input', event => {
            event.preventDefault();

            if (!event.data) {
                return;
            }

            $password.setAttribute('value', $password.getAttribute('value') + event.data);

            $password.innerText = '*'.repeat($password.getAttribute('value').length);

            return false;
        });

        $terminal.clear(false).$io.appendChild($password);
    }

    onLoginProvided(input, $terminal, $termOS) {
        if (!input) {
            return;
        }

        if (input !== 'root') {
            this.showLoginInput($terminal);

            return;
        }

        this.showPasswordInput($terminal);
    }

    onPasswordProvided(input, $terminal, $termOS) {
        if (!input) {
            return;
        }

        if (input !== 'root') {
            this.showLoginInput($terminal);

            return;
        }

        if ($terminal.constructor.welcomeMessage) {
            $terminal.clear(false);

            $terminal.print($terminal.constructor.welcomeMessage(), true, $terminal.constructor.OUTPUT_TYPES.SUCCESS);
        }
    }

    run(input, $terminal, $termOS) {
        this.showLoginInput($terminal);
    }
}
