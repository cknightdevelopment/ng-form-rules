import { RuleFunc } from "./rule-func";
import { RuleOptions } from "./rule-options";
import { Observable } from "rxjs";
import { AsyncRuleFunc } from "./async-rule-func";

export interface Rule<T> {
    func?: RuleFunc<T, any>;
    asyncFunc?: AsyncRuleFunc<T, any>;
    options?: RuleOptions;
}