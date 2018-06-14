import { AbstractModelSettings, Property } from "ng-form-rules";

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
                    this.builder.ruleSync(register => !!register.username)));

                p.valid.push(this.builder.validTest(
                    'Username must be between 5 and 15 characters',
                    this.builder.ruleSync(register => (register.username || "").length >= 5 && (register.username || "").length <= 15)));
            }),
            this.builder.property('password', p => {
                p.valid.push(this.builder.validTest(
                    'Password is required',
                    this.builder.ruleGroup([
                        this.builder.ruleSync(this.hasPassword)
                    ])));
            }),
            this.builder.property('confirmPassword', p => {
                p.valid.push(this.builder.validTest(
                    'This must match password',
                    this.builder.ruleSync(this.passwordsMatch, { dependencyProperties: ['password'] }),
                    this.builder.ruleSync(this.hasPassword, { dependencyProperties: ['password'] })));
            }),
            this.builder.property('acceptTerms', p => {
                p.valid.push(this.builder.validTest(
                    "You must accept the terms",
                    this.builder.ruleSync(register => !!register.acceptTerms)));
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