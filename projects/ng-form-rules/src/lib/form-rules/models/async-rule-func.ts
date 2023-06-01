import { Observable } from "rxjs";

/**
 * Function for an async rule
 */
export type AsyncRuleFunc<T, R> = (value: T, rootValue?: R) => Observable<boolean>;