import { Observable } from "rxjs";

export type RuleAsyncFunc<T, R> = (value: T, rootValue?: R) => Observable<boolean> | Promise<boolean> | PromiseLike<T>;