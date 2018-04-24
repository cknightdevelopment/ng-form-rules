import { Property } from '../models/property';
import { RuleGroup } from '../models/rule-group';
import { Rule } from '../models/rule';
import { Test } from '../models/test';
import { ArrayItemProperty } from '../models/array-item-property';
import { RuleSet } from '../models/rule-set';

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
    property<T>(propertyName: keyof T, extend?: (prop: Property<T>) => void): Property<T> {
        if (!propertyName || typeof propertyName !== 'string') throw Error('Invalid property name');

        const property = new Property<T>(propertyName);

        if (extend) extend(property);

        return property;
    }

    /**
     * Creates a property for an array item
     * @param extend function to extend the array item property
     * @returns created array item property
     */
    arrayItemProperty<T>(extend: (prop: ArrayItemProperty<T>) => void): ArrayItemProperty<T> {
        const property = new ArrayItemProperty<T>();
        extend(property);
        return property;
    }
}