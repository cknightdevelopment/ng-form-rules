import { Test } from "./test";
import { Property } from "./property";
import { ArrayItemProperty } from "./array-item-property";

export abstract class PropertyBase<T> {
    valid: Test<T>[];
    edit: Test<T>[];
    view: Test<T>[];

    /**
     * Properties for a complex object
     */
    properties: Property<any>[];

    /**
     * Property for an item of an array
     */
    arrayItemProperty: ArrayItemProperty<any>;
}