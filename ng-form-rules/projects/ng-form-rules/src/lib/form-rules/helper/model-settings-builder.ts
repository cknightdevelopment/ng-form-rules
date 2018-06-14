import { Property } from '../models/property';
import { RuleGroup } from '../models/rule-group';
import { Rule } from '../models/rule';
import { Test } from '../models/test';
import { ArrayItemProperty } from '../models/array-item-property';
import { RuleSet } from '../models/rule-set';
import { RuleFunc } from '../models/rule-func';
import { RuleOptions } from '../models/rule-options';
import { AsyncRuleFunc } from '../models/async-rule-func';

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
    arrayItemProperty<T>(extend?: (prop: ArrayItemProperty<T>) => void): ArrayItemProperty<T> {
        const property = new ArrayItemProperty<T>();

        if (extend) extend(property);

        return property;
    }

    validTest<T>(message: string, check: RuleSet<T>, condition?: RuleSet<T>): Test<T> {
        return this.validNamedTest(null, message, check, condition);
    }

    validNamedTest<T>(name: string, message: string, check: RuleSet<T>, condition?: RuleSet<T>): Test<T> {
        return {
            name: name,
            message: message,
            check: check,
            condition: condition
        } as Test<T>;
    }

    editTest<T>(check: RuleSet<T>, condition?: RuleSet<T>): Test<T> {
        return this.editNamedTest(null, check, condition);
    }

    editNamedTest<T>(name: string, check: RuleSet<T>, condition?: RuleSet<T>): Test<T> {
        return {
            name: name,
            check: check,
            condition: condition
        } as Test<T>;
    }

    rule<T, R>(func: RuleFunc<T, R>, options?: RuleOptions): Rule<T> {
        return this.ruleCombo(func, null, options);
    }

    ruleAsync<T, R>(asyncFunc: AsyncRuleFunc<T, R>, options?: RuleOptions): Rule<T> {
        return this.ruleCombo(null, asyncFunc, options);
    }

    ruleCombo<T, R>(func: RuleFunc<T, R>, asyncFunc: AsyncRuleFunc<T, R>, options?: RuleOptions): Rule<T> {
        return {
            func: func,
            asyncFunc: asyncFunc,
            options: options
        } as Rule<T>;
    }

    ruleGroup<T>(rules: RuleSet<T>[], any?: boolean): RuleGroup<T> {
        return {
            rules: rules,
            any: any
        } as RuleGroup<T>;
    }
}