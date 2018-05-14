import { Observable } from "rxjs/Observable";

export type AsyncRuleFunc<T, R> = (value: T, rootValue?: R) => Observable<boolean>;