import { Test } from "./test";
import { Property } from "./property";
import { ArrayItemProperty } from "./array-item-property";

export abstract class PropertyBase<T> {
    private _absolutePath: string;

    valid: Test<T>[];
    edit: Test<T>[];
    view: Test<T>[];

    /**
     * Properties for a complex object
     */
    properties?: Property<any>[];

    /**
     * Property for an item of an array
     */
    arrayItemProperty?: ArrayItemProperty<any>;

    /**
     * Absolute path to property from root
     */
    get absolutePath(): string {
        return this._absolutePath;
    }

    /**
     * Determines if the property is an ArrayItemProperty
     * @param property Property to check
     * @returns Whether or not the property is an ArrayItemProperty
     */
    static isArrayItemProperty<T>(property: PropertyBase<T>) {
        return !(property as Property<T>).name;
    }

    /**
     * Internal use only, do not call!
     */
    setAbsolutePath(absolutePath: string): void {
        this._absolutePath = absolutePath;
    }
}