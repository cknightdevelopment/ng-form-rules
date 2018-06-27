import { RuleGroup } from "./rule-group";
import { Rule } from "./rule";

/**
 * Type representing rules in the form of a RuleGroup or single Rule
 */
export type RuleSet<T> = RuleGroup<T> | Rule<T>;