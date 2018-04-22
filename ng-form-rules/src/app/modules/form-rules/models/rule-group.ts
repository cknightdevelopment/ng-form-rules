import { Rule } from "./rule";
import { RuleSet } from "./rule-set";

export interface RuleGroup<T> {
    any?: boolean;
    rules: Array<RuleSet<T>>;
}