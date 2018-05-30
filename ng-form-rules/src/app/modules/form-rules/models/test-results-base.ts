import { TestResult } from "./test-result";

export class TestResultsBase<T> {
    constructor(public results: TestResult<T>[]) {
        this.results = this.results || [];
    }

    get passed(): boolean {
        return !this.failedResults.length;
    }

    get passedResults(): TestResult<T>[] {
        return this.results.filter(x => x.passed);
    }

    get failedResults(): TestResult<T>[] {
        return this.results.filter(x => !x.passed);
    }

    get message(): string {
        return this.messages[0];
    }

    get messages(): string[] {
        const messages = this.failedResults.map(x => x.message);
        return Array.from(new Set(messages));
    }
}