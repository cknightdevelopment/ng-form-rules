import { RuleGroup } from "./rule-group";
import { Rule } from "./rule";

export interface Validation<T> {
    message?: string;
    check: RuleGroup<T> | Rule<T>;
    condition?: RuleGroup<T> | Rule<T>;
}