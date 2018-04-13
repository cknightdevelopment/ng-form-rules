import { Property } from "../models/property";

export class ModelSettingsBuilder {
    /**
     * Creates a property
     * @param propertyName property name
     * @param extend function to extend the property
     * @returns created property
     */
    property<T>(propertyName: keyof T, extend: (prop: Property<T>) => void): Property<T> {
        if (!propertyName || typeof propertyName !== "string") throw Error("Invalid property name");

		let property = new Property<T>(propertyName);
        extend(property);
        return property;
    }
}