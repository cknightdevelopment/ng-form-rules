import { Test } from "./test";

export interface TestSyncGroups<T> {
    sync: Test<T>[];
    async: Test<T>[];
}