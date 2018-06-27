import { RuleSet } from "./rule-set";

/**
 * Collection of rule sets with metadata
 */
export interface RuleGroup<T> {
    /**
     * Determines if the rule group should pass if any (one) of its rules pass
     */
    any?: boolean;

    /**
     * Collection of rule sets
     */
    rules: Array<RuleSet<T>>;
}