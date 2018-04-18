import { Validation } from "./validation";
import { Property } from "./property";
import { ArrayItemProperty } from "./array-item-property";

export abstract class PropertyBase<T> {
    valid: Validation<T>[];
    editable: Validation<T>[];
    visible: Validation<T>[];

    /**
     * Properties for a complex object
     */
    properties: Property<any>[];

    /**
     * Property for an item of an array
     */
    arrayItemProperty: ArrayItemProperty<any>;
}