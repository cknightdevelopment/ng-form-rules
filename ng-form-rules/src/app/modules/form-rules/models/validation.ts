import { RuleGroup } from "./rule-group";
import { Rule } from "./rule";

export interface Validation<T> {
    check: RuleGroup<T> | Rule<T>;
    message?: string;
    condition?: RuleGroup<T> | Rule<T>;
}