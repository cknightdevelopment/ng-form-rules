import { Property, RuleGroup, ValidationFunc, Validation, Rule } from '../models/property';

/**
 * Utility class for building model settings
 */
export class ModelSettingsBuilder {
    /**
     * Creates a property
     * @param propertyName property name
     * @param extend function to extend the property
     * @returns created property
     */
    property<T>(propertyName: keyof T, extend: (prop: Property<T>) => void): Property<T> {
        if (!propertyName || typeof propertyName !== 'string') throw Error('Invalid property name');

        const property = new Property<T>(propertyName);
        extend(property);
        return property;
    }

    /**
     * Create a validation with a message
     * @param message Message when validation fails
     * @param check Rules for the validation
     * @returns create validation
     */
    validation<T>(
        message: string,
        check: RuleGroup<T> | Rule<T>,
        condition?: RuleGroup<T> | Rule<T>
    ): Validation<T> {
        return {
            message: message,
            check: check,
            condition: condition
        } as Validation<T>;
    }
}