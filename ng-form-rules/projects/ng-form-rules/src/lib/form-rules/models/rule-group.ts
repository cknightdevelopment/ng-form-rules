import { RuleSet } from "./rule-set";
import { RuleGroupOptions } from "./rule-group-options";

/**
 * Collection of rule sets with metadata
 */
export interface RuleGroup<T> {
    /**
     * Additional rule group options
     */
    options?: RuleGroupOptions;

    /**
     * Collection of rule sets
     */
    rules: Array<RuleSet<T>>;
}