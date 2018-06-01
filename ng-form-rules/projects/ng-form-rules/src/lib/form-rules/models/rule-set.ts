import { RuleGroup } from "./rule-group";
import { Rule } from "./rule";

export type RuleSet<T> = RuleGroup<T> | Rule<T>;