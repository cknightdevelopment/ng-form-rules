import { PropertyBase } from "./property-base";

/**
 * Non-array item property
 */
export class Property<T> extends PropertyBase<T> {
    private _name: string;

    /**
     * Name of the property
     */
    get name(): string {
        return this._name;
    }

    constructor(name: string) {
        super();
        this._name = name;
    }
}