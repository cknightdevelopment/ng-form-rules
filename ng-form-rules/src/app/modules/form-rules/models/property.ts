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
    message?: string;
	check: RuleGroup<T> | Rule<T>;
	condition?: RuleGroup<T> | Rule<T>;
    explicitDependencyProperties?: string[];
}

export interface RuleGroup<T> {
    any: boolean;
    rules: Array<RuleGroup<T> | Rule<T>>;
}

export interface Rule<T> {
    func: ValidationFunc<T>;
}