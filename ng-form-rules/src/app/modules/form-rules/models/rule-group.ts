import { Rule } from "./rule";

export interface RuleGroup<T> {
    any: boolean;
    rules: Array<RuleGroup<T> | Rule<T>>;
}