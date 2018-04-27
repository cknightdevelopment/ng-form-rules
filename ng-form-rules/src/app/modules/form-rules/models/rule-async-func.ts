import { Observable } from "rxjs/Observable";

export type RuleAsyncFunc<T, R> = (value: T, rootValue?: R) => Observable<boolean> | Promise<boolean> | PromiseLike<T>;