import { Observable } from "rxjs";

export type AsyncRuleFunc<T, R> = (value: T, rootValue?: R) => Observable<boolean>;