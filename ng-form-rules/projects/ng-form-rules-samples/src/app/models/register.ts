import { AbstractModelSettings, Property } from "ng-form-rules";

export class RegisterModelSettings extends AbstractModelSettings<Register> {
    protected buildPropertyRules(): Property<Register>[] {
        return [
            this.builder.property('username', p => {
                p.valid = [
                    {
                        message: "Username is required",
                        check: {
                            func: (register) => !!register.username
                        }
                    }
                ];
            }),
            this.builder.property('password'),
            this.builder.property('confirmPassword', p => {
                p.valid = [
                    {
                        message: "This must match password",
                        check: {
                            func: (register) => register.password == register.confirmPassword,
                            options: {
                                dependencyProperties: ['password']
                            }
                        },
                        condition: {
                            func: (register) => !!register.password
                        }
                    }
                ];
            }),
            this.builder.property('acceptTerms', p => {
                p.valid = [
                    {
                        message: "You must accept the terms",
                        check: {
                            func: (register) => !!register.acceptTerms
                        }
                    }
                ];
            }),
        ];
    }
}

export class Register {
    username: string;
    password: string;
    confirmPassword: string;
    acceptTerms: boolean;
}