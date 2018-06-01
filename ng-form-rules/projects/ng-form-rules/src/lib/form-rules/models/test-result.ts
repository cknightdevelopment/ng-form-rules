export interface TestResult<T> {
    message?: string;
    name?: string;
    passed: boolean;
}