import { Observable } from "rxjs";

/**
 * Asyncronous function for a rule that takes its parent's value and root value, and returns an Observable
 * or Promise boolean that determines if the rule has passed
 */
export type RuleAsyncFunc<T, R> = (value: T, rootValue?: R) => Observable<boolean> | Promise<boolean> | PromiseLike<T>;