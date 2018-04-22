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

    get messages(): string[] {
        const messages = this.failedResults.map(x => x.message);
        return Array.from(new Set(messages));
    }
}

export class PropertyTestResults<T> extends TestResultsBase<T> {
    constructor(public propertyName: string, results: TestResult<T>[]) {
        super(results);
    }
}

export interface TestResult<T> {
    message?: string;
    name?: string;
    passed: boolean;
}