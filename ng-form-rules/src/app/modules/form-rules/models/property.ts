export class Property<T> {
    validations: Validation<T>[];

    private _name: string;
    get name(): string {
        return this._name;
    }

    constructor(name: string) {
        this._name = name;
    }
}

export type ValidationFunc<T> = (value: T) => boolean;

export interface Validation<T> {
    check: RuleGroup<T> | Rule<T>;
    message?: string;
    condition?: RuleGroup<T> | Rule<T>;
}

export interface RuleGroup<T> {
    any: boolean;
    rules: Array<RuleGroup<T> | Rule<T>>;
}

export interface Rule<T> {
    func: ValidationFunc<T>;
    options?: RuleOptions;
}

export interface RuleOptions {
    dependencyProperties?: string[];
}