import { RuleGroup } from "./rule-group";
import { Rule } from "./rule";
import { RuleSet } from "./rule-set";

export interface Test<T> {
    message?: string;
    name?: string;
    check: RuleSet<T>;
    condition?: RuleSet<T>;
}