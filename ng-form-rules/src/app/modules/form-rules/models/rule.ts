import { RuleFunc } from "./rule-func";
import { RuleOptions } from "./rule-options";

export interface Rule<T> {
    func: RuleFunc<T, any>;
    options?: RuleOptions;
}