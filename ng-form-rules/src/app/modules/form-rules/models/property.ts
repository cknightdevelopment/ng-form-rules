import { Validation } from "./validation";

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