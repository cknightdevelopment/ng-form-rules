/**
 * Result of a test execution
 */
export interface TestResult<T> {
    /**
     * Message of the test (only if it failed)
     */
    message?: string;

    /**
     * Name of the test
     */
    name?: string;

    /**
     * Whether the test passed
     */
    passed: boolean;

    /**
     * Whether the test was skipped
     */
    skipped?: boolean;
}