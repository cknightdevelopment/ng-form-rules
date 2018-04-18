import { Validation } from "./validation";
import { PropertyBase } from "./property-base";

export class Property<T> extends PropertyBase<T> {
    private _name: string;
    get name(): string {
        return this._name;
    }

    constructor(name: string) {
        super();
        this._name = name;
    }
}