import { TestResult } from "./test-result";

/**
 * Results of executing a collection of tests
 */
export class TestResultsBase<T> {
    constructor(public results: TestResult<T>[]) {
        this.results = this.results || [];
    }

    /**
     * Whether the tests passed
     */
    get passed(): boolean {
        return !this.failedResults.length;
    }

    /**
     * Array of test results that passed
     */
    get passedResults(): TestResult<T>[] {
        return this.results.filter(x => !!x.passed && !x.skipped);
    }

    /**
     * Array of test results that failed
     */
    get failedResults(): TestResult<T>[] {
        return this.results.filter(x => !x.passed);
    }

    /**
     * Array of test results that were skipped
     */
    get skippedResults(): TestResult<T>[] {
        return this.results.filter(x => !!x.skipped);
    }

    /**
     * Message of the first test that failed
     */
    get message(): string {
        return this.messages[0];
    }

    /**
     * Messages of all failed tests
     */
    get messages(): string[] {
        const messages = this.failedResults.map(x => x.message);
        return Array.from(new Set(messages));
    }
}