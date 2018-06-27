import { RuleFunc } from "./rule-func";
import { RuleOptions } from "./rule-options";
import { AsyncRuleFunc } from "./async-rule-func";

/**
 * Executable function with associated metadata
 */
export interface Rule<T> {
    /**
     * Syncronous function to execute when the rule is processed
     */
    func?: RuleFunc<T, any>;

    /**
     * Asyncronous function to execute when the rule is processed
     */
    asyncFunc?: AsyncRuleFunc<T, any>;

    /**
     * Options for further configuration of the rule
     */
    options?: RuleOptions;
}