import { ValidationFunc } from "./validation-func";
import { RuleOptions } from "./rule-options";

export interface Rule<T> {
    func: ValidationFunc<T>;
    options?: RuleOptions;
}