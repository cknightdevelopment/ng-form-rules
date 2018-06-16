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
     * @param propertyName Property name
     * @param extend Function to extend the property
     * @returns Created property
     */
    property<T>(propertyName: keyof T, extend?: (prop: Property<T>) => void): Property<T> {
        if (!propertyName || typeof propertyName !== 'string') throw Error('Invalid property name');

        const property = new Property<T>(propertyName);

        if (extend) extend(property);

        return property;
    }

    /**
     * Creates an array item property
     * @param extend Function to extend the array item property
     * @returns Created array item property
     */
    arrayItemProperty<T>(extend?: (prop: ArrayItemProperty<T>) => void): ArrayItemProperty<T> {
        const property = new ArrayItemProperty<T>();

        if (extend) extend(property);

        return property;
    }

    /**
     * Creates a validation test
     * @param message Message when the test fails
     * @param check Check rule set for the test
     * @param condition Condition rule set for the test
     * @returns Created validation test
     */
    validTest<T>(message: string, check: RuleSet<T>, condition?: RuleSet<T>): Test<T> {
        return this.validNamedTest(null, message, check, condition);
    }

    /**
     * Creates a named validation test
     * @param name Name of the test
     * @param message Message when the test fails
     * @param check Check rule set for the test
     * @param condition Condition rule set for the test
     * @returns Created named validation test
     */
    validNamedTest<T>(name: string, message: string, check: RuleSet<T>, condition?: RuleSet<T>): Test<T> {
        return {
            name: name,
            message: message,
            check: check,
            condition: condition
        } as Test<T>;
    }

    /**
     * Creates an edit test
     * @param check Check rule set for the test
     * @param condition Condition rule set for the test
     * @returns Created edit test
     */
    editTest<T>(check: RuleSet<T>, condition?: RuleSet<T>): Test<T> {
        return this.editNamedTest(null, check, condition);
    }

    /**
     * Creates a named edit test
     * @param name Name of the test
     * @param check Check rule set for the test
     * @param condition Condition rule set for the test
     * @returns Created named edit test
     */
    editNamedTest<T>(name: string, check: RuleSet<T>, condition?: RuleSet<T>): Test<T> {
        return {
            name: name,
            check: check,
            condition: condition
        } as Test<T>;
    }

    /**
     * Creates a rule
     * @param func Function for the rule
     * @param options Additional rule options
     * @returns Created rule
     */
    rule<T, R>(func: RuleFunc<T, R>, options?: RuleOptions): Rule<T> {
        return this.ruleCombo(func, null, options);
    }

    /**
     * Creates an async rule
     * @param asyncFunc Async function for the rule
     * @param options Additional rule options
     * @returns Created rule
     */
    ruleAsync<T, R>(asyncFunc: AsyncRuleFunc<T, R>, options?: RuleOptions): Rule<T> {
        return this.ruleCombo(null, asyncFunc, options);
    }

    /**
     * Creates a combo rule that has both syncronous and async functions
     * @param func Function for the rule
     * @param asyncFunc Async function for the rule
     * @param options Additional rule options
     * @returns Created rule
     */
    ruleCombo<T, R>(func: RuleFunc<T, R>, asyncFunc: AsyncRuleFunc<T, R>, options?: RuleOptions): Rule<T> {
        return {
            func: func,
            asyncFunc: asyncFunc,
            options: options
        } as Rule<T>;
    }

    /**
     * Creates a rule group
     * @param ruleSets Rule sets for the rule group
     * @param any Setting that indicates if the rule group should pass if any of the rule sets pass (compared to all of them passing)
     * @returns Created rule group
     */
    ruleGroup<T>(ruleSets: RuleSet<T>[], any?: boolean): RuleGroup<T> {
        return {
            rules: ruleSets,
            any: any
        } as RuleGroup<T>;
    }
}