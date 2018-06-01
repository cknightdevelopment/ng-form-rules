import { TestResultsBase } from "./test-results-base";
import { TestResult } from "./test-result";

export class PropertyTestResults<T> extends TestResultsBase<T> {
    constructor(public propertyName: string, results: TestResult<T>[]) {
        super(results);
    }
}