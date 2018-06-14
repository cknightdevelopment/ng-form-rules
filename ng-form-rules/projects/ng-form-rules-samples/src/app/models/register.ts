import { AbstractModelSettings, Property } from "ng-form-rules";
import { of } from "rxjs";

export class Register {
    username: string;
    password: string;
    confirmPassword: string;
    acceptTerms: boolean;
}

export class RegisterModelSettings extends AbstractModelSettings<Register> {
    protected buildPropertyRules(): Property<Register>[] {
        return [
            this.builder.property('username', p => {
                p.valid.push(this.builder.validTest(
                    'Username is required',
                    this.builder.rule(register => !!register.username)));

                p.valid.push(this.builder.validTest(
                    'Username must be between 5 and 15 characters',
                    this.builder.rule(register => (register.username || "").length >= 5 && (register.username || "").length <= 15)));

                p.valid.push(this.builder.validTest(
                    'Username must be be unique',
                    this.builder.ruleAsync(register => of(['chris'].indexOf(register.username) < 0)),
                    this.builder.rule(register => !!register.username)));
            }),
            this.builder.property('password', p => {
                p.valid.push(this.builder.validTest(
                    'Password is required',
                    this.builder.ruleGroup([
                        this.builder.rule(this.hasPassword)
                    ])));
            }),
            this.builder.property('confirmPassword', p => {
                p.valid.push(this.builder.validTest(
                    'This must match password',
                    this.builder.rule(this.passwordsMatch, { dependencyProperties: ['password'] }),
                    this.builder.rule(this.hasPassword, { dependencyProperties: ['password'] })));
            }),
            this.builder.property('acceptTerms', p => {
                p.valid.push(this.builder.validTest(
                    "You must accept the terms",
                    this.builder.rule(register => !!register.acceptTerms)));
            }),
        ];
    }

    private hasPassword(register: Register) {
        return !!register.password;
    }

    private passwordsMatch(register: Register) {
        return register.password === register.confirmPassword;
    }
}